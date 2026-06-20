import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EncryptionService } from '../certificados/encryption.service';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer-extra';
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
import { Page } from 'puppeteer';
import { TipoComprobante, Prisma } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import { XmlParserService } from '../xml-parser/xml-parser.service';

// Registrar el plugin de sigilo para evitar detecciones de Cloudflare
puppeteer.use(StealthPlugin());

@Injectable()
export class RpaService {
  private readonly logger = new Logger(RpaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cifrado: EncryptionService,
    private readonly config: ConfigService,
    private readonly xmlParser: XmlParserService,
  ) {}

  /**
   * Ejecuta el bot de Puppeteer para iniciar sesión en el SRI y extraer las claves de acceso de compras.
   */
  async sincronizarCompras(
    empresaId: string,
    anio: number,
    mes: number,
    tipoComprobante: string = 'Factura',
  ): Promise<{ nuevas: number; total: number }> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
    });

    if (
      !empresa ||
      !empresa.sri_usuario ||
      !empresa.sri_contrasena_encriptada
    ) {
      throw new BadRequestException(
        'La empresa no tiene configuradas las credenciales del SRI.',
      );
    }

    const contrasenaSri = this.cifrado.decryptString(
      empresa.sri_contrasena_encriptada,
    );
    const ruc = empresa.ruc;

    this.logger.log(
      `Iniciando robot de sincronización de compras para la empresa ${empresa.razon_social} (RUC: ${ruc})`,
    );

    // IMPORTANTE: Basado en el bot de Python, reCAPTCHA Enterprise detecta fuertemente el modo headless del SRI.
    // Se fuerza a false para garantizar que no baje el puntaje.
    const isHeadless = false;
    const browser = await puppeteer.launch({
      headless: isHeadless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    const page = await browser.newPage();
    // Se comenta el User-Agent forzado. El plugin Stealth ya se encarga de esto.
    // Forzar un User-Agent desactualizado (Chrome 120) en un navegador moderno causa que
    // reCAPTCHA Enterprise detecte la discrepancia y asigne un score de 0.0 ("Captcha incorrecta").
    // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    try {
      // 1. Navegar a la página de login del SRI (Keycloak SSO)
      const authUrl =
        'https://srienlinea.sri.gob.ec/auth/realms/Internet/protocol/openid-connect/auth?client_id=app-sri-claves-angular&redirect_uri=https%3A%2F%2Fsrienlinea.sri.gob.ec%2Fsri-en-linea%2F%2Fcontribuyente%2Fperfil&response_type=code&scope=openid';

      this.logger.log(
        'Navegando directamente a la URL de autenticación Keycloak...',
      );
      let directoExitoso = true;
      try {
        await page.goto(authUrl, {
          waitUntil: 'networkidle2',
          timeout: 25000,
        });
        // Verificar si cargó el campo de usuario para confirmar que estamos en Keycloak
        await page.waitForSelector('#username', { timeout: 8000 });
      } catch (err) {
        this.logger.warn(
          `No se pudo cargar la URL directa de autenticación o tardó demasiado: ${(err as Error).message}. Intentando método interactivo desde la página base...`,
        );
        directoExitoso = false;
      }

      if (!directoExitoso) {
        // Método interactivo como fallback
        await page.goto(
          'https://srienlinea.sri.gob.ec/sri-en-linea/inicio/NAT',
          {
            waitUntil: 'networkidle2',
            timeout: 30000,
          },
        );

        this.logger.log(
          'Buscando botón de Iniciar Sesión en la página base...',
        );
        const loginClicked = await page.evaluate(() => {
          const cleanText = (t: string) =>
            t
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toUpperCase()
              .trim();

          // Buscar específicamente un enlace o botón que diga "Iniciar sesión" o "Ingresar"
          const elements = Array.from(
            document.querySelectorAll('a, button, [role="button"], span'),
          );
          const targetBtn = elements.find((el) => {
            const txt = cleanText(el.textContent || '');
            return (
              txt === 'INICIAR SESION' ||
              txt === 'INGRESAR' ||
              txt === 'INICIAR SESIÓN' ||
              txt === 'LOGIN'
            );
          });

          if (targetBtn) {
            const clickable = targetBtn.closest('a, button') || targetBtn;
            (clickable as HTMLElement).click();
            clickable.dispatchEvent(
              new MouseEvent('click', { bubbles: true, cancelable: true }),
            );
            return true;
          }

          // Fallback a selectores de id específicos
          const specificSelectors = [
            '#boton-inicio-sesion',
            '#btnInicioSesion',
            'a[href*="openid-connect/auth"]',
          ];
          for (const selector of specificSelectors) {
            const el = document.querySelector(selector) as HTMLElement;
            if (el) {
              el.click();
              el.dispatchEvent(
                new MouseEvent('click', { bubbles: true, cancelable: true }),
              );
              return true;
            }
          }
          return false;
        });

        if (loginClicked) {
          this.logger.log(
            'Se hizo clic en Iniciar Sesión. Esperando redirección a Keycloak...',
          );
          await page
            .waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 })
            .catch(() => {
              this.logger.warn(
                'La navegación tras hacer clic tardó más de lo esperado o fue interceptada. Continuando...',
              );
            });
        } else {
          this.logger.error(
            'No se pudo encontrar el botón de Iniciar Sesión de forma interactiva en la página base.',
          );
        }
      }

      // 2. Ingresar usuario (RUC) y contraseña de forma robusta sin usar clicks propensos a fallar
      await page.waitForSelector('#username', { timeout: 15000 });
      await page.focus('#username');
      await page.evaluate(() => {
        const input = document.querySelector('#username') as HTMLInputElement;
        if (input) input.value = '';
      });
      await page.type('#username', ruc, { delay: 100 });

      await page.waitForSelector('#password', { timeout: 15000 });
      await page.focus('#password');
      await page.evaluate(() => {
        const input = document.querySelector('#password') as HTMLInputElement;
        if (input) input.value = '';
      });
      await page.type('#password', contrasenaSri, { delay: 100 });

      // 3. Resolver reCAPTCHA si está presente
      const recaptchaPresente = await page.evaluate(() => {
        return document.querySelector('iframe[src*="recaptcha"]') !== null;
      });

      if (recaptchaPresente) {
        this.logger.log(
          'reCAPTCHA de Google detectado en Keycloak. Iniciando resolvedor de audio...',
        );
        await this.resolverRecaptcha(page);
      } else {
        this.logger.log('No se detectó reCAPTCHA al ingresar en Keycloak.');
      }

      // 4. Hacer clic en "Ingresar" (Botón de Keycloak `#kc-login`)
      await page.click('#kc-login');

      // Esperar a que inicie la sesión (usamos 'load' para evitar que llamadas AJAX infinitas de la encuesta causen timeout)
      await page.waitForNavigation({ waitUntil: 'load', timeout: 25000 });

      // Verificar si la URL sigue en Keycloak (login fallido)
      if (page.url().includes('/auth/realms/Internet/')) {
        const loginError = await page.evaluate(() => {
          const errNode =
            document.querySelector('.alert-error') ||
            document.querySelector('.kc-feedback-text') ||
            document.querySelector('#input-error');
          return errNode
            ? errNode.textContent?.trim()
            : 'Credenciales inválidas o error de inicio de sesión en el SRI';
        });
        throw new BadRequestException(
          `Fallo al autenticar en el SRI: ${loginError}`,
        );
      }

      this.logger.log(
        'Sesión en el SRI en línea iniciada con éxito. Perfil contribuyente cargado.',
      );

      // Bypass de Modales Emergentes (como la Encuesta de Satisfacción):
      // Removemos diálogos, popups y overlays del DOM para evitar que bloqueen la navegación o interacción
      this.logger.log(
        'Eliminando posibles modales emergentes (encuestas, popups)...',
      );
      await page.evaluate(() => {
        const dialogs = document.querySelectorAll(
          '.ui-dialog, .modal, [role="dialog"], div[class*="dialog"], div[class*="modal"]',
        );
        dialogs.forEach((el) => el.remove());
        const overlays = document.querySelectorAll(
          '.ui-widget-overlay, .modal-backdrop, div[class*="overlay"]',
        );
        overlays.forEach((el) => el.remove());
        document.body.classList.remove('ui-overflow-hidden', 'modal-open');
      });

      // Esperar 4 segundos para asegurar la propagación de tokens y cookies de sesión
      this.logger.log(
        'Esperando estabilización de sesión y cookies de fondo...',
      );
      await page.evaluate(() => new Promise((r) => setTimeout(r, 4000)));

      // 5. Navegar interactivamente mediante los menús del portal para heredar la sesión SSO
      this.logger.log(
        'Navegando a la pantalla de comprobantes mediante el menú lateral...',
      );

      // Intentar expandir el menú lateral buscando el botón de hamburguesa / toggle
      const menuExpanded = await page.evaluate(() => {
        const selectors = [
          '#boton-menu',
          '#btnMenu',
          '.ui-sidebar-close',
          'button[class*="menu"]',
          'a[class*="menu"]',
          'button[class*="toggle"]',
          'a[class*="toggle"]',
          '[class*="bars"]',
          '[class*="menu-icon"]',
          '.pi-bars',
          '.fa-bars',
          '.ui-button-icon-only',
        ];

        for (const selector of selectors) {
          const elements = Array.from(document.querySelectorAll(selector));
          for (const el of elements) {
            const style = window.getComputedStyle(el);
            if (
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              (el as HTMLElement).offsetWidth > 0
            ) {
              (el as HTMLElement).click();
              return true;
            }
          }
        }
        return false;
      });

      if (menuExpanded) {
        this.logger.log(
          'Se hizo clic en el botón de menú/hamburguesa para expandir el panel.',
        );
      } else {
        this.logger.log(
          'No se encontró un botón de menú explícito o ya estaba visible.',
        );
      }
      await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));

      // Configurar escucha para detectar la apertura de una nueva pestaña
      const newPagePromise = new Promise<Page | null>((resolve) => {
        const listener = async (target: any) => {
          if (target.type() === 'page') {
            browser.off('targetcreated', listener);
            resolve(await target.page());
          }
        };
        browser.on('targetcreated', listener);
        setTimeout(() => {
          browser.off('targetcreated', listener);
          resolve(null);
        }, 12000);
      });

      // 1. Expandir "FACTURACIÓN ELECTRÓNICA" de forma incondicional
      this.logger.log('Expandiendo "FACTURACIÓN ELECTRÓNICA"...');

      let principalExpanded = await page.evaluate(() => {
        const cleanText = (t: string) =>
          t
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .trim();

        // 1. Intentar por el ID específico descubierto en el HTML real del SRI
        const targetById = document.getElementById(
          'sri-menu-icon-facturacion-electronica',
        ) as HTMLElement;
        if (targetById) {
          const clickable =
            targetById.closest('a, li, button, [role="button"]') || targetById;
          (clickable as HTMLElement).click();
          clickable.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true }),
          );
          return true;
        }

        // 2. Fallback: búsqueda por texto normalizado
        const elements = Array.from(
          document.querySelectorAll('a, span, li, div, mat-list-item, p'),
        );
        let target = elements.find((el) => {
          const text = cleanText(el.textContent || '');
          return text === 'FACTURACION ELECTRONICA';
        });

        if (!target) {
          target = elements.find((el) => {
            const text = cleanText(el.textContent || '');
            return (
              text.includes('FACTURACION ELECTRONICA') ||
              (text.includes('FACTURAC') && text.includes('ELECTRONIC'))
            );
          });
        }

        if (target) {
          const clickable =
            target.closest('a, li, button, [role="button"]') || target;
          (clickable as HTMLElement).click();
          clickable.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true }),
          );
          return true;
        }
        return false;
      });

      if (!principalExpanded) {
        this.logger.log(
          'Texto o ID "FACTURACIÓN ELECTRÓNICA" no encontrado directamente. Buscando por selectores de iconos de facturación o primer ítem de menú...',
        );
        principalExpanded = await page.evaluate(() => {
          const iconSelectors = [
            'span.pi-file',
            'i.fa-file',
            'span[class*="file"]',
            'i[class*="file"]',
            'span.pi-envelope',
            'i.fa-envelope',
            'span[class*="envelope"]',
            'i[class*="envelope"]',
            '.ui-menuitem:nth-child(2) > a',
            'ul.ui-menu-list > li:nth-child(2) > a',
          ];
          for (const selector of iconSelectors) {
            const el = document.querySelector(selector) as HTMLElement;
            if (el) {
              const clickable =
                el.closest('a, li, button, [role="button"]') || el;
              (clickable as HTMLElement).click();
              clickable.dispatchEvent(
                new MouseEvent('click', { bubbles: true, cancelable: true }),
              );
              return true;
            }
          }
          return false;
        });
      }

      if (!principalExpanded) {
        this.logger.warn(
          'No se pudo encontrar ni expandir el menú de Facturación Electrónica.',
        );
      }

      // Esperar 2 segundos a la animación de expansión antes de buscar el submenú
      await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));

      // Hacer clic en "Comprobantes electrónicos recibidos" de forma 100% dinámica por contenido y heurística
      const subClicked = await page.evaluate(() => {
        const cleanText = (t: string) =>
          t
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .trim();

        // 1. Buscar en todos los spans, enlaces y botones del documento que tengan el texto normalizado coincidente
        const elements = Array.from(
          document.querySelectorAll('a, span, button'),
        );
        let target = elements.find((el) => {
          const text = cleanText(el.textContent || '');
          return text === 'COMPROBANTES ELECTRONICOS RECIBIDOS';
        });

        if (!target) {
          target = elements.find((el) => {
            const text = cleanText(el.textContent || '');
            return (
              text.includes('COMPROBANTES ELECTRONICOS RECIBIDOS') ||
              (text.includes('COMPROBANT') && text.includes('RECIBID'))
            );
          });
        }

        if (target) {
          // Asegurar hacer clic en el elemento interactivo real (enlace <a> o botón) si está envuelto en uno
          const clickable =
            target.closest('a, button, [role="button"]') || target;
          (clickable as HTMLElement).click();
          clickable.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true }),
          );
          return true;
        }

        // 2. Fallback heurístico por hrefs relativos dinámicos en el DOM (sin URLs completas ni ids fijos)
        const allLinks = Array.from(document.querySelectorAll('a'));
        const matchLink = allLinks.find((a) => {
          const href = (a.getAttribute('href') || '').toLowerCase();
          return href.includes('recibido') || href.includes('comprobante');
        });

        if (matchLink) {
          matchLink.click();
          matchLink.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true }),
          );
          return true;
        }

        // 3. Fallback en selectores generales o iconos de descarga del submenú
        const subSelectorsFallback = [
          'span.pi-download',
          'i.fa-download',
          'span[class*="download"]',
          '.ui-menuitem-active a',
          'ul.ui-submenu-list a',
        ];
        for (const selector of subSelectorsFallback) {
          const el = document.querySelector(selector) as HTMLElement;
          if (el) {
            el.click();
            el.dispatchEvent(
              new MouseEvent('click', { bubbles: true, cancelable: true }),
            );
            return true;
          }
        }

        // 4. Fallback en enlaces del submenú abierto
        const openSubmenuLinks = Array.from(
          document.querySelectorAll(
            '.ui-menuitem-panel a, ul.ui-menu-list li.ui-menuitem-active ul a',
          ),
        );
        if (openSubmenuLinks.length > 0) {
          const recibidosLink = openSubmenuLinks.find(
            (link) =>
              link.getAttribute('href')?.includes('recibidos') ||
              link.textContent?.toUpperCase().includes('RECIBID'),
          );
          if (recibidosLink) {
            (recibidosLink as HTMLElement).click();
            recibidosLink.dispatchEvent(
              new MouseEvent('click', { bubbles: true, cancelable: true }),
            );
            return true;
          }
        }
        return false;
      });

      if (!subClicked) {
        this.logger.warn(
          'No se pudo hacer clic en el submenú de Comprobantes electrónicos recibidos.',
        );
      }

      // Esperar a que la nueva pestaña se abra o continuar en la pestaña activa
      let activePage: Page = page;
      const openedPage = await newPagePromise;
      if (openedPage) {
        this.logger.log(
          'Nueva pestaña detectada. Cambiando contexto a la aplicación de comprobantes.',
        );
        activePage = openedPage;
        await activePage.setViewport({ width: 1280, height: 800 });
      } else {
        this.logger.log(
          'No se abrió una nueva pestaña. Continuando en la pestaña actual.',
        );
      }

      // CRÍTICO: Inyectar overrides anti-detección de reCAPTCHA Enterprise antes de que la página cargue por completo.
      // reCAPTCHA Enterprise baja el score a 0.0 si detecta que la pestaña no tiene foco o está oculta.
      await activePage.evaluateOnNewDocument(`
        Document.prototype.hasFocus = function() { return true; };
        Object.defineProperty(document, 'hidden', { get: function() { return false; }, configurable: true });
        Object.defineProperty(document, 'visibilityState', { get: function() { return 'visible'; }, configurable: true });
        document.addEventListener('visibilitychange', function(e) { e.stopImmediatePropagation(); e.preventDefault(); }, true);
        window.addEventListener('blur', function(e) { e.stopImmediatePropagation(); }, true);
        document.addEventListener('blur', function(e) { if (e.target === document) e.stopImmediatePropagation(); }, true);
        document.addEventListener('freeze', function(e) { e.stopImmediatePropagation(); }, true);
        setInterval(function() { window.dispatchEvent(new Event('focus')); document.dispatchEvent(new FocusEvent('focus')); }, 2000);
      `);

      // Esperar a que cargue la aplicación de consulta
      await activePage
        .waitForNavigation({ waitUntil: 'load', timeout: 25000 })
        .catch(() => {
          this.logger.log(
            'La navegación tardó un poco o se completó en segundo plano.',
          );
        });

      // Traducir número de mes a texto en español (como requiere el combo select del SRI)
      const nombresMeses = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ];
      const nombreMes = nombresMeses[mes - 1];

      this.logger.log(
        `Consultando el periodo completo de ${nombreMes} de ${anio} usando la opción TODOS los días...`,
      );

      // 1. Cargar caché de selectores si existe (ahora en la carpeta storage)
      const cachePath = path.join(
        process.cwd(),
        'storage',
        'rpa-selectors.json',
      );
      let cachedSelectors: any = null;
      try {
        if (existsSync(cachePath)) {
          const content = await fs.readFile(cachePath, 'utf-8');
          cachedSelectors = JSON.parse(content);
        }
      } catch (e) {
        this.logger.debug(
          'No se pudo leer la caché de selectores, se iniciará detección heurística.',
        );
      }

      let anioSelectId = '';
      let mesSelectId = '';
      let diaSelectId = '';
      let btnSelectorFinal = '';

      // 2. Verificar Fast Path (si los IDs cacheados siguen presentes en el DOM)
      if (
        cachedSelectors &&
        cachedSelectors.anioId &&
        cachedSelectors.mesId &&
        cachedSelectors.btnSelector
      ) {
        const stillValid = await activePage.evaluate((cache) => {
          const anio = document.getElementById(cache.anioId);
          const mes = document.getElementById(cache.mesId);

          // Si la caché tiene diaId, validamos que también exista
          const dia = cache.diaId ? document.getElementById(cache.diaId) : true;

          // Para el selector de botón que puede tener caracteres escapados
          let btn = null;
          try {
            btn = document.querySelector(cache.btnSelector);
          } catch (e) {}

          return !!(anio && mes && dia && btn);
        }, cachedSelectors);

        if (stillValid) {
          this.logger.log(
            'Selectores cacheados siguen siendo válidos. Usando Fast Path.',
          );
          anioSelectId = cachedSelectors.anioId;
          mesSelectId = cachedSelectors.mesId;
          diaSelectId = cachedSelectors.diaId || '';
          btnSelectorFinal = cachedSelectors.btnSelector;
        } else {
          this.logger.log(
            'Selectores cacheados ya no son válidos en el DOM actual. Iniciando Auto-Reparación (Self-Healing)...',
          );
        }
      }

      // 3. Autodetección heurística profunda si el Fast Path falló
      if (!anioSelectId || !mesSelectId || !btnSelectorFinal) {
        this.logger.log(
          'Detectando de forma heurística los selectores de Año, Mes, Día y Botón Consultar...',
        );
        const detectedSelects = await activePage.evaluate(() => {
          const selects = Array.from(document.querySelectorAll('select'));
          let anioId = '';
          let mesId = '';
          let diaId = '';

          for (const select of selects) {
            const options = Array.from(select.options);
            const texts = options.map((opt) => opt.text.toUpperCase());
            const values = options.map((opt) => opt.value.toUpperCase());

            const tieneMeses = texts.some(
              (txt) =>
                txt.includes('ENERO') ||
                txt.includes('FEBRERO') ||
                txt.includes('MARZO') ||
                txt.includes('MAYO'),
            );
            if (tieneMeses) {
              mesId = select.id;
              continue;
            }

            const tieneAnios = options.some((opt) =>
              /^\\d{4}$/.test(opt.text.trim()),
            );
            if (tieneAnios && !mesId) {
              anioId = select.id;
              continue;
            }

            const tieneDias =
              texts.some(
                (txt) =>
                  txt.includes('TODOS') || txt.includes('DIA') || txt === '1',
              ) || values.some((val) => val === '0' || val === '');
            if (tieneDias && select.id !== mesId && select.id !== anioId) {
              diaId = select.id;
            }
          }

          if (!anioId) {
            const fallbackAnio = selects.find(
              (s) =>
                s.id.toLowerCase().includes('ano') ||
                s.id.toLowerCase().includes('anio'),
            );
            anioId = fallbackAnio
              ? fallbackAnio.id
              : selects[0]
                ? selects[0].id
                : '';
          }
          if (!mesId) {
            const fallbackMes = selects.find((s) =>
              s.id.toLowerCase().includes('mes'),
            );
            mesId = fallbackMes
              ? fallbackMes.id
              : selects[1]
                ? selects[1].id
                : '';
          }
          if (!diaId) {
            const fallbackDia = selects.find((s) =>
              s.id.toLowerCase().includes('dia'),
            );
            diaId = fallbackDia
              ? fallbackDia.id
              : selects[2]
                ? selects[2].id
                : '';
          }

          // Heurística de Botón (Text-based / ID fallback)
          let btnFinal = '';
          const cands = Array.from(
            document.querySelectorAll(
              'button, input[type="button"], input[type="submit"], a.ui-button',
            ),
          );
          for (const el of cands) {
            const text = (
              el.textContent ||
              el.getAttribute('value') ||
              ''
            ).toLowerCase();
            const id = (el.id || '').toLowerCase();
            // Buscar variaciones de buscar o consultar
            if (
              id.includes('consultar') ||
              id.includes('buscar') ||
              text.includes('busca') ||
              text.includes('consult')
            ) {
              if (el.id) {
                // Escapar dos puntos de JSF
                btnFinal =
                  'button[id="' + el.id + '"], input[id="' + el.id + '"]';
                break;
              }
            }
          }

          if (!btnFinal) {
            btnFinal =
              'button[id="frmPrincipal:btnConsultarSinRe"], button[id*="Consultar"], button[id*="consultar"], button[id*="buscar"], .ui-button';
          }

          return { anioId, mesId, diaId, btnSelector: btnFinal };
        });

        anioSelectId = detectedSelects.anioId;
        mesSelectId = detectedSelects.mesId;
        diaSelectId = detectedSelects.diaId;
        btnSelectorFinal = detectedSelects.btnSelector;

        this.logger.log(
          `Selectores identificados heurísticamente - Año: #${anioSelectId}, Mes: #${mesSelectId}, Botón: ${btnSelectorFinal}`,
        );

        // 4. Aprendizaje: Guardar nuevos selectores (Self-Healing exitoso)
        if (anioSelectId && mesSelectId && btnSelectorFinal) {
          try {
            await fs.mkdir(path.dirname(cachePath), { recursive: true });
            await fs.writeFile(
              cachePath,
              JSON.stringify(
                {
                  anioId: anioSelectId,
                  mesId: mesSelectId,
                  diaId: diaSelectId,
                  btnSelector: btnSelectorFinal,
                },
                null,
                2,
              ),
            );
            this.logger.log(
              'Nuevos selectores guardados en caché rpa-selectors.json para la próxima ejecución.',
            );
          } catch (e) {
            this.logger.debug('No se pudo escribir en la caché de selectores.');
          }
        }
      }
      `Selectores identificados dinámicamente - Año/Ano: #${anioSelectId}, Mes: #${mesSelectId}, Día: #${diaSelectId}`;

      if (!anioSelectId || !mesSelectId) {
        throw new BadRequestException(
          'No se pudieron ubicar los selectores de año o mes en la página del SRI.',
        );
      }

      // Esperar a que reCAPTCHA Enterprise esté COMPLETAMENTE listo
      this.logger.log(
        'Esperando inicialización completa de reCAPTCHA Enterprise...',
      );
      try {
        await activePage.waitForFunction(
          "() => typeof grecaptcha !== 'undefined' && grecaptcha.enterprise && typeof grecaptcha.enterprise.execute === 'function'",
          { timeout: 10000 },
        );
      } catch (err) {
        this.logger.warn(
          'grecaptcha.enterprise no se detectó o tardó demasiado, continuando...',
        );
      }

      // Iniciar simulación humana en background (mouse + scroll continuos) basada en el bot de Python
      this.logger.log(
        'Iniciando simulación humana en background para mejorar el score...',
      );
      await activePage.evaluate(() => {
        const body = document.body;
        const w = window.innerWidth || 1280;
        const h = window.innerHeight || 800;
        const numPts = 10 + Math.floor(Math.random() * 5);
        const pts: Array<[number, number]> = [];
        for (let i = 0; i < numPts; i++) {
          pts.push([
            50 + Math.floor(Math.random() * (w - 100)),
            50 + Math.floor(Math.random() * (h - 100)),
          ]);
        }
        let idx = 0;
        const iv = setInterval(
          () => {
            if (idx >= pts.length) {
              clearInterval(iv);
              return;
            }
            const p = pts[idx++];
            body.dispatchEvent(
              new MouseEvent('mousemove', {
                clientX: p[0],
                clientY: p[1],
                bubbles: true,
              }),
            );
          },
          100 + Math.floor(Math.random() * 150),
        );

        const scrollY = 80 + Math.floor(Math.random() * 200);
        setTimeout(
          () => window.scrollTo({ top: scrollY, behavior: 'smooth' }),
          200 + Math.floor(Math.random() * 300),
        );
        setTimeout(
          () => window.scrollTo({ top: 0, behavior: 'smooth' }),
          800 + Math.floor(Math.random() * 400),
        );
      });
      await activePage.evaluate(() => new Promise((r) => setTimeout(r, 800)));

      // Seleccionar Año, Mes y Día usando interacciones de confianza de Puppeteer
      // Esto es crucial para reCAPTCHA Enterprise Invisible, ya que inyectar valores mediante evaluate()
      // reduce el score dramáticamente al no emitir eventos Trusted del navegador.
      this.logger.log(
        `Seleccionando Año = ${anio} y Mes = ${nombreMes} mediante selectores nativos...`,
      );

      try {
        await activePage.waitForSelector(`select[id="${anioSelectId}"]`, {
          timeout: 5000,
        });
        await activePage.select(`select[id="${anioSelectId}"]`, String(anio));
        await activePage.evaluate(() => new Promise((r) => setTimeout(r, 800)));

        // Mapear el mes al valor del select. Los select del SRI suelen tener value="1", "2", etc. o el texto.
        // Obtenemos el option_value correspondiente al nombre del mes.
        const mesValue = await activePage.evaluate(
          (mesId, mesName) => {
            const select = document.getElementById(mesId) as HTMLSelectElement;
            const option = Array.from(select.options).find(
              (opt) =>
                opt.text.toUpperCase().includes(mesName.toUpperCase()) ||
                opt.value.toUpperCase().includes(mesName.toUpperCase()),
            );
            return option ? option.value : mesName;
          },
          mesSelectId,
          nombreMes,
        );

        await activePage.select(`select[id="${mesSelectId}"]`, mesValue);
        await activePage.evaluate(() => new Promise((r) => setTimeout(r, 800)));
      } catch (err) {
        this.logger.warn(
          `Fallo al usar selectores nativos, intentando fallback de JS: ${(err as Error).message}`,
        );
        await activePage.evaluate(
          (anioId, anioVal, mesId, mesVal) => {
            const anioSelect = document.getElementById(
              anioId,
            ) as HTMLSelectElement;
            if (anioSelect) {
              const option = Array.from(anioSelect.options).find(
                (opt) => opt.value === anioVal || opt.text.trim() === anioVal,
              );
              if (option) {
                anioSelect.value = option.value;
              } else {
                anioSelect.value = anioVal;
              }
              anioSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const mesSelect = document.getElementById(
              mesId,
            ) as HTMLSelectElement;
            if (mesSelect) {
              const option = Array.from(mesSelect.options).find(
                (opt) =>
                  opt.text.toUpperCase().includes(mesVal.toUpperCase()) ||
                  opt.value.toUpperCase().includes(mesVal.toUpperCase()),
              );
              if (option) {
                mesSelect.value = option.value;
              } else {
                mesSelect.value = mesVal;
              }
              mesSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
          },
          anioSelectId,
          String(anio),
          mesSelectId,
          nombreMes,
        );
      }

      await activePage.evaluate(() => new Promise((r) => setTimeout(r, 1500)));

      // Configurar el combo de Día en TODOS
      if (diaSelectId) {
        this.logger.log(
          `Seleccionando TODOS en el selector de Día (${diaSelectId})...`,
        );
        try {
          const diaValue = await activePage.evaluate((diaId) => {
            const select = document.getElementById(diaId) as HTMLSelectElement;
            const option = Array.from(select.options).find(
              (opt) =>
                opt.text.toUpperCase().includes('TODO') ||
                opt.value.toUpperCase().includes('TODO') ||
                opt.value === '0' ||
                opt.value === '',
            );
            return option ? option.value : '0';
          }, diaSelectId);

          await activePage.select(`select[id="${diaSelectId}"]`, diaValue);
        } catch (err) {
          await activePage.evaluate((diaId) => {
            const select = document.getElementById(diaId) as HTMLSelectElement;
            if (select) {
              const option = Array.from(select.options).find(
                (opt) =>
                  opt.text.toUpperCase().includes('TODO') ||
                  opt.value.toUpperCase().includes('TODO') ||
                  opt.value === '0' ||
                  opt.value === '',
              );
              if (option) {
                select.value = option.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
          }, diaSelectId);
        }
      }

      // Buscar y seleccionar el Tipo de Comprobante
      if (tipoComprobante && tipoComprobante.toUpperCase() !== 'TODOS') {
        this.logger.log(
          `Seleccionando Tipo de Comprobante = ${tipoComprobante}...`,
        );
        try {
          const tipoSelectHandle = await activePage.evaluateHandle(() => {
            const selects = Array.from(document.querySelectorAll('select'));
            // Buscar un select que tenga las opciones típicas de comprobantes
            return selects.find((s) => {
              const optionsText = Array.from(s.options).map((o) =>
                o.text.toUpperCase(),
              );
              return (
                optionsText.some((t) => t.includes('FACTURA')) &&
                optionsText.some(
                  (t) =>
                    t.includes('RETENCION') ||
                    t.includes('RETENCIÓN') ||
                    t.includes('LIQUIDACION'),
                )
              );
            });
          });

          const element = tipoSelectHandle.asElement() as any;
          if (element) {
            const id = await activePage.evaluate((el: any) => el.id, element);
            const valToSelect = await activePage.evaluate(
              (el: any, targetText: string) => {
                const sel = el as HTMLSelectElement;
                const option = Array.from(sel.options).find(
                  (opt) =>
                    opt.text.toUpperCase().includes(targetText.toUpperCase()) ||
                    opt.value.toUpperCase().includes(targetText.toUpperCase()),
                );
                return option ? option.value : null;
              },
              element,
              tipoComprobante,
            );

            if (valToSelect && id) {
              await activePage.select(`select[id="${id}"]`, valToSelect);
              await activePage.evaluate(
                () => new Promise((r) => setTimeout(r, 800)),
              );
            } else {
              this.logger.warn(
                `No se encontró la opción de tipo de comprobante: ${tipoComprobante}`,
              );
            }
            await tipoSelectHandle.dispose();
          } else {
            this.logger.warn(
              'No se encontró el selector de Tipo de Comprobante dinámicamente.',
            );
          }
        } catch (err) {
          this.logger.warn(
            `Error al intentar seleccionar el tipo de comprobante: ${(err as Error).message}`,
          );
        }
      }

      // Definimos una función para hacer clic en el botón de consulta
      const clickConsultar = async () => {
        try {
          this.logger.log(
            'Intentando hacer clic en el botón de consulta mediante JS...',
          );
          await activePage.waitForSelector(btnSelectorFinal, { timeout: 8000 });
          await activePage.evaluate((btnSel) => {
            const btn = document.querySelector(btnSel) as HTMLElement;
            if (btn) btn.click();
            else throw new Error('Botón no encontrado');
          }, btnSelectorFinal);
        } catch (err) {
          this.logger.warn(
            `El clic por selector falló: ${(err as Error).message}. Buscando botón dinámicamente...`,
          );
          const btnHandle = await activePage.evaluateHandle(() => {
            const buttons = Array.from(
              document.querySelectorAll(
                'button, input[type="button"], input[type="submit"], .ui-button',
              ),
            );
            return buttons.find((btn) => {
              const txt = btn.textContent?.trim().toUpperCase() || '';
              const val =
                (btn as HTMLInputElement).value?.trim().toUpperCase() || '';
              return (
                txt.includes('CONSULTAR') ||
                txt.includes('BUSCAR') ||
                val.includes('CONSULTAR') ||
                val.includes('BUSCAR')
              );
            });
          });
          const element = btnHandle.asElement() as any;
          if (element) {
            await activePage.evaluate(
              (el) => (el as HTMLElement).click(),
              element,
            );
            await btnHandle.dispose();
          } else {
            await btnHandle.dispose();
            throw new Error(
              'No se pudo encontrar el botón de consulta dinámicamente.',
            );
          }
        }
      };

      // 1er intento de clic
      await clickConsultar();

      // Esperamos un momento para ver si aparece el error de captcha o si la tabla carga
      this.logger.log(
        'Esperando resultados de la consulta masiva del mes (o validando captcha)...',
      );
      let captchaIncorrecta = false;
      try {
        await activePage.waitForFunction(
          () => {
            // Buscamos si aparece el error de captcha o si ya cargó una fila de resultados
            const errorMsg = Array.from(
              document.querySelectorAll(
                '.ui-messages-error-summary, .ui-message-error-detail',
              ),
            ).some((el) => el.textContent?.toLowerCase().includes('captcha'));
            if (errorMsg) return 'error_captcha';

            const rows = Array.from(document.querySelectorAll('tr'));
            if (rows.some((row) => /\d{49}/.test(row.textContent || '')))
              return 'tabla_cargada';

            return false;
          },
          { timeout: 15000 },
        );

        // Verificamos si la función retornó 'error_captcha'
        captchaIncorrecta = await activePage.evaluate(() => {
          return Array.from(
            document.querySelectorAll(
              '.ui-messages-error-summary, .ui-message-error-detail',
            ),
          ).some((el) => el.textContent?.toLowerCase().includes('captcha'));
        });
      } catch (e) {
        this.logger.warn(
          'Tiempo de espera agotado validando el primer clic. Continuando...',
        );
      }

      // Si salió captcha incorrecta, hacemos un segundo intento ("vuelva a hacer click una vez mas")
      if (captchaIncorrecta) {
        this.logger.warn(
          'Se detectó "Captcha incorrecta". Realizando el segundo clic de reintento como solicitó el usuario...',
        );
        await activePage.evaluate(
          () => new Promise((r) => setTimeout(r, 2000)),
        );
        await clickConsultar();

        // Esperamos nuevamente por los resultados
        try {
          await activePage.waitForFunction(
            () => {
              const rows = Array.from(document.querySelectorAll('tr'));
              return rows.some((row) => /\d{49}/.test(row.textContent || ''));
            },
            { timeout: 15000 },
          );
        } catch (e) {
          this.logger.warn(
            'No se detectó la tabla tras el segundo intento. Usando espera estática...',
          );
          await activePage.evaluate(
            () => new Promise((r) => setTimeout(r, 4000)),
          );
        }
      }

      // 7. Configurar descargas de Puppeteer en un directorio bien organizado por Empresa/Tipo/Año/Mes
      const strMes = mes.toString().padStart(2, '0');
      const dirTipo = tipoComprobante
        .toLowerCase()
        .replace(/[\s\/]/g, '_')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const downloadDir = path.join(
        process.cwd(),
        'storage',
        'comprobantes',
        ruc,
        'recibidos',
        anio.toString(),
        strMes,
        dirTipo,
      );
      await fs.mkdir(downloadDir, { recursive: true });

      const client = await activePage.target().createCDPSession();
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadDir,
      });

      this.logger.log(
        `Directorio de descargas de comprobantes configurado en: ${downloadDir}`,
      );

      // Obtener la información de todas las filas presentes en la tabla usando selectores dinámicos
      this.logger.log(
        'Extrayendo claves de acceso y enlaces de descarga de la tabla de resultados...',
      );
      const filasComprobantes = await activePage.evaluate(() => {
        // Buscar cualquier fila de tabla en el documento
        const rows = Array.from(document.querySelectorAll('tr'));
        return rows
          .map((row) => {
            // Extraer la clave de acceso de 49 dígitos mediante regex
            const textContent = row.textContent || '';
            const matchClave = textContent.match(/\d{49}/);
            const clave = matchClave ? matchClave[0] : '';

            if (!clave) return { clave: '', xmlBtnId: '' };

            // Identificar el botón/enlace de descarga XML de forma heurística en la fila
            const elements = Array.from(
              row.querySelectorAll('a, button, [role="button"]'),
            );
            const xmlBtn = elements.find((el) => {
              const id = (el.id || '').toLowerCase();
              const txt = (el.textContent || '').trim().toUpperCase();
              const cls = (el.className || '').toLowerCase();
              const title = (el.getAttribute('title') || '').toLowerCase();

              return (
                id.includes('xml') ||
                txt === 'XML' ||
                cls.includes('xml') ||
                title.includes('xml') ||
                cls.includes('download') ||
                cls.includes('pi-download') ||
                cls.includes('fa-download')
              );
            });

            const xmlBtnId = xmlBtn ? xmlBtn.id : '';

            return { clave, xmlBtnId };
          })
          .filter((f) => f.clave && f.xmlBtnId);
      });

      this.logger.log(
        `Sincronización masiva de claves finalizada. Comprobantes encontrados en la tabla: ${filasComprobantes.length}`,
      );

      let nuevasCount = 0;

      // 8. Procesar y descargar el XML de cada comprobante
      for (const fila of filasComprobantes) {
        const { clave, xmlBtnId } = fila;

        // Comprobar si ya existe el comprobante con su respectivo XML en el disco
        const existe = await this.prisma.comprobanteRecibido.findUnique({
          where: { clave_acceso: clave },
        });

        if (existe && existe.url_xml && existsSync(existe.url_xml)) {
          this.logger.log(
            `El comprobante ${clave} ya se encuentra registrado y descargado previamente.`,
          );
          continue;
        }

        this.logger.log(`Descargando XML de la clave de acceso ${clave}...`);

        try {
          const targetFilePath = path.join(downloadDir, `${clave}.xml`);

          // 1. Limpiar descargas genéricas previas para evitar colisiones de nombres genéricos en el disco
          try {
            if (existsSync(downloadDir)) {
              const files = await fs.readdir(downloadDir);
              for (const file of files) {
                const lowerFile = file.toLowerCase();
                // Si es un archivo XML que no está renombrado con la clave de 49 dígitos, lo eliminamos
                if (
                  lowerFile.endsWith('.xml') &&
                  !/^\d{49}\.xml$/.test(lowerFile)
                ) {
                  await fs.unlink(path.join(downloadDir, file)).catch(() => {});
                }
              }
            }
          } catch (cleanError) {
            this.logger.warn(
              `No se pudo realizar la limpieza de archivos genéricos previos: ${(cleanError as Error).message}`,
            );
          }

          // 2. Re-configurar comportamiento de descargas de CDP antes de cada descarga para evitar reinicios por navegación de JSF
          const downloadClient = await activePage.target().createCDPSession();
          await downloadClient.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadDir,
          });

          // 3. Hacer clic en el botón de descarga del XML en la fila correspondiente
          // IMPORTANTE: Usamos clics nativos para evitar que reCAPTCHA Enterprise asigne un score bajo (0.0)
          try {
            // Simular movimiento de ratón natural hacia el botón
            const btnBox = await activePage.evaluate((id) => {
              const el = document.getElementById(id);
              if (!el) return null;
              const rect = el.getBoundingClientRect();
              return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              };
            }, xmlBtnId);

            if (btnBox) {
              const targetX = btnBox.x + btnBox.width / 2;
              const targetY = btnBox.y + btnBox.height / 2;
              await activePage.mouse.move(targetX, targetY, { steps: 5 });
              await new Promise((r) =>
                setTimeout(r, 100 + Math.random() * 200),
              );
            }

            // Usamos selector por atributo para evitar problemas de escape con caracteres especiales como ':' en los IDs de JSF
            await activePage.click(`[id="${xmlBtnId}"]`);
          } catch (e) {
            this.logger.warn(
              `Fallo el click nativo de descarga, usando JS: ${(e as Error).message}`,
            );
            await activePage.evaluate((btnId) => {
              const btn = document.getElementById(btnId) as HTMLElement;
              if (btn) {
                btn.click();
                btn.dispatchEvent(
                  new MouseEvent('click', { bubbles: true, cancelable: true }),
                );
              }
            }, xmlBtnId);
          }

          // 4. Monitorear y esperar que aparezca un archivo XML nuevo genérico (máximo 10 segundos)
          let archivoDescargado: string | null = null;
          for (let i = 0; i < 20; i++) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            const archivosAhora = await fs.readdir(downloadDir);

            // Buscar un archivo XML que no sea de 49 dígitos (que es la clave renombrada)
            const detectado = archivosAhora.find(
              (f) =>
                f.toLowerCase().endsWith('.xml') &&
                !/^\d{49}\.xml$/.test(f.toLowerCase()) &&
                !f.endsWith('.crdownload') &&
                !f.endsWith('.tmp'),
            );

            if (detectado) {
              const tempPath = path.join(downloadDir, detectado);
              try {
                const stat = await fs.stat(tempPath);
                if (stat.size > 0) {
                  archivoDescargado = detectado;
                  break;
                }
              } catch (e) {
                // El archivo puede estar escribiéndose en el disco
              }
            }
          }

          let razonSocial = 'PROVEEDOR EXTRACTO RPA';
          let importeTotal = 0.0;
          let fileSavedPath: string | null = null;
          let fechaEmision = new Date();

          let finalClave = clave; // Clave real que se usará para BD
          let rucEmisor = clave.substring(10, 23);
          let tipoCod = clave.substring(8, 10);
          let tipoComprobante = this.mapTipoComprobanteFromSriCode(tipoCod);

          if (archivoDescargado) {
            const oldPath = path.join(downloadDir, archivoDescargado);
            const xmlContent = await fs.readFile(oldPath, 'utf8');

            try {
              // Extraer TODO directamente del XML como fuente de verdad absoluta
              const dataXml =
                this.xmlParser.parsearComprobanteRecibido(xmlContent);

              if (dataXml.claveAcceso && dataXml.claveAcceso.length === 49) {
                finalClave = dataXml.claveAcceso;
              }

              if (dataXml.rucEmisor) rucEmisor = dataXml.rucEmisor;
              if (dataXml.codDoc) {
                tipoCod = dataXml.codDoc;
                tipoComprobante = this.mapTipoComprobanteFromSriCode(tipoCod);
              }

              razonSocial =
                dataXml.razonSocialEmisor || 'PROVEEDOR EXTRACTO RPA';
              importeTotal = dataXml.importeTotal || 0.0;

              if (dataXml.fechaEmision) {
                // Formato SRI: DD/MM/YYYY
                const parts = dataXml.fechaEmision.split('/');
                if (parts.length === 3) {
                  fechaEmision = new Date(
                    Number(parts[2]),
                    Number(parts[1]) - 1,
                    Number(parts[0]),
                  );
                }
              }
            } catch (err) {
              this.logger.warn(
                `Error del XML Parser con archivo ${archivoDescargado}: ${(err as Error).message}.`,
              );
            }

            // Guardar el archivo con el nombre de la clave REAL (49 dígitos)
            fileSavedPath = path.join(downloadDir, `${finalClave}.xml`);
            await fs.rename(oldPath, fileSavedPath);
            this.logger.log(`Archivo XML guardado como ${finalClave}.xml`);
          } else {
            this.logger.warn(
              `No se detectó la descarga física para la fila con clave extraída ${clave}.`,
            );
            // Fallback en caso de que no haya XML, aunque las fechas estarán mal si la clave era un falso positivo.
            const fechaDia = finalClave.substring(0, 2);
            const fechaMes = finalClave.substring(2, 4);
            const fechaAnio = finalClave.substring(4, 8);
            fechaEmision = new Date(
              Number(fechaAnio),
              Number(fechaMes) - 1,
              Number(fechaDia),
            );
          }

          // Registrar en la base de datos usando upsert con la info ABSOLUTA del XML
          await this.prisma.comprobanteRecibido.upsert({
            where: { clave_acceso: finalClave },
            update: {
              importe_total: new Prisma.Decimal(importeTotal),
              razon_social_emisor: razonSocial,
              ruc_emisor: rucEmisor,
              tipo_comprobante: tipoComprobante,
              url_xml: fileSavedPath,
              fecha_emision: fechaEmision,
            },
            create: {
              empresa_id: empresaId,
              clave_acceso: finalClave,
              tipo_comprobante: tipoComprobante,
              ruc_emisor: rucEmisor,
              razon_social_emisor: razonSocial,
              importe_total: new Prisma.Decimal(importeTotal),
              fecha_emision: fechaEmision,
              numero_autorizacion: finalClave,
              fecha_autorizacion: fechaEmision,
              url_xml: fileSavedPath,
            },
          });

          nuevasCount++;
          // Pausa más natural y aleatoria para no saturar al SRI ni alertar a reCAPTCHA
          const delay = 1500 + Math.floor(Math.random() * 1500);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } catch (downloadError) {
          this.logger.error(
            `Error procesando descarga de XML para clave ${clave}: ${(downloadError as Error).message}`,
          );
        }
      }

      this.logger.log(
        `Sincronización de base de datos terminada. Nuevas registradas y descargadas: ${nuevasCount}`,
      );
      return { nuevas: nuevasCount, total: filasComprobantes.length };
    } catch (error) {
      this.logger.error(
        `Error en la sincronización del RPA: ${(error as Error).message}`,
      );
      throw error;
    } finally {
      await browser.close();
    }
  }

  /**
   * Resuelve el widget de reCAPTCHA mediante el bypass de audio y Wit.ai
   */
  private async resolverRecaptcha(page: Page) {
    const witToken =
      this.config.get<string>('app.rpa.witToken') ||
      'CGR5DGWJZJQY6M4M7WLP4WPHFSPEXO5B';

    await page.waitForSelector('iframe[title="reCAPTCHA"]', { timeout: 12000 });
    const iframeCheckboxElement = await page.$('iframe[title="reCAPTCHA"]');
    const iframeCheckbox = await iframeCheckboxElement?.contentFrame();

    if (!iframeCheckbox) {
      throw new Error(
        'No se pudo acceder al iframe del checkbox del reCAPTCHA.',
      );
    }

    await iframeCheckbox.waitForSelector('.recaptcha-checkbox-border', {
      timeout: 5000,
    });
    await iframeCheckbox.click('.recaptcha-checkbox-border');
    await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));

    const iframeChallengeElement = await page.$(
      'iframe[src*="recaptcha/api2/bframe"]',
    );
    const iframeChallenge = await iframeChallengeElement?.contentFrame();

    if (!iframeChallenge) {
      this.logger.log(
        'No apareció ventana de desafío, reCAPTCHA resuelto automáticamente.',
      );
      return;
    }

    await iframeChallenge.waitForSelector('#recaptcha-audio-button', {
      timeout: 5000,
    });
    await iframeChallenge.click('#recaptcha-audio-button');
    await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));

    await iframeChallenge.waitForSelector('.rc-audiochallenge-download-link', {
      timeout: 5000,
    });
    const audioUrl = await iframeChallenge.evaluate(() => {
      const link = document.querySelector(
        '.rc-audiochallenge-download-link',
      ) as HTMLAnchorElement;
      return link ? link.href : '';
    });

    if (!audioUrl) {
      throw new Error(
        'No se encontró el enlace de descarga del audio del reCAPTCHA.',
      );
    }

    this.logger.log(`Descargando audio de captcha desde: ${audioUrl}`);

    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Fallo al descargar el archivo de audio del reCAPTCHA.');
    }
    const audioBuffer = await audioResponse.arrayBuffer();

    this.logger.log('Enviando audio a Wit.ai para Speech-to-Text...');
    const witResponse = await fetch('https://api.wit.ai/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${witToken}`,
        'Content-Type': 'audio/mpeg',
      },
      body: Buffer.from(audioBuffer),
    });

    if (!witResponse.ok) {
      const errorText = await witResponse.text();
      throw new Error(
        `Error en el servicio Speech-to-Text de Wit.ai: ${errorText}`,
      );
    }

    const witData: any = await witResponse.json();
    const textoTranscrito = witData.text?.trim();

    if (!textoTranscrito) {
      throw new Error('Wit.ai no pudo transcribir ningún texto del audio.');
    }

    this.logger.log(`Audio transcrito exitosamente: "${textoTranscrito}"`);

    await iframeChallenge.type('#audio-response', textoTranscrito);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 500)));

    await iframeChallenge.click('#recaptcha-verify-button');
    await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));
  }

  private mapTipoComprobanteFromSriCode(code: string): TipoComprobante {
    const map: Record<string, TipoComprobante> = {
      '01': TipoComprobante.FACTURA,
      '03': TipoComprobante.LIQUIDACION_COMPRA,
      '04': TipoComprobante.NOTA_CREDITO,
      '05': TipoComprobante.NOTA_DEBITO,
      '06': TipoComprobante.GUIA_REMISION,
      '07': TipoComprobante.RETENCION,
    };
    return map[code] || TipoComprobante.FACTURA;
  }

  /**
   * Obtiene el listado de comprobantes de compras (recibidos) sincronizados.
   */
  async listarRecibidos(empresaId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.comprobanteRecibido.findMany({
        where: { empresa_id: empresaId },
        orderBy: { fecha_emision: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.comprobanteRecibido.count({
        where: { empresa_id: empresaId },
      }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
