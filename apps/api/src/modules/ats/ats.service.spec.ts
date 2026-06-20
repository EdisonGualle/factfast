import { Test, TestingModule } from '@nestjs/testing';
import { AtsService } from './ats.service';
import { AtsBuilderService } from './ats-builder.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

describe('AtsService', () => {
  let service: AtsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    empresa: {
      findUnique: jest.fn(),
    },
    comprobante: {
      findMany: jest.fn(),
    },
    comprobanteRecibido: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtsService,
        AtsBuilderService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AtsService>(AtsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe generar el XML del ATS correctamente con ventas y compras', async () => {
    // Mock Empresa
    (prisma.empresa.findUnique as jest.Mock).mockResolvedValue({
      id: 'empresa-uuid',
      ruc: '1792345678001',
      razon_social: 'EMPRESA PRUEBA S.A.',
      sucursales: [{ codigo: '001' }],
    });

    // Mock Ventas (Comprobantes Emitidos)
    (prisma.comprobante.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'invoice-1',
        tipo_comprobante: 'FACTURA',
        estado: 'AUTORIZADO',
        serie: '001002',
        numero_secuencial: '000000010',
        tipo_identificacion_comprador: '04', // RUC
        identificacion_comprador: '1790011122001',
        subtotal_sin_impuestos: 100.0,
        subtotal_iva_0: 20.0,
        subtotal_iva_15: 80.0,
        subtotal_exento: 0,
        subtotal_no_objeto: 0,
        total_iva: 12.0,
        total_ice: 0,
        importe_total: 112.0,
        formas_pago: [{ forma_pago: '20' }],
      },
      {
        id: 'invoice-2',
        tipo_comprobante: 'FACTURA',
        estado: 'ANULADO',
        serie: '001002',
        numero_secuencial: '000000011',
        tipo_identificacion_comprador: '04',
        identificacion_comprador: '1790011122001',
        subtotal_sin_impuestos: 50.0,
        subtotal_iva_0: 50.0,
        subtotal_iva_15: 0,
        subtotal_exento: 0,
        subtotal_no_objeto: 0,
        total_iva: 0,
        total_ice: 0,
        importe_total: 50.0,
        formas_pago: [{ forma_pago: '20' }],
      },
    ]);

    // Mock Compras (Comprobantes Recibidos)
    (prisma.comprobanteRecibido.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'compra-1',
        tipo_comprobante: 'FACTURA',
        clave_acceso: '0506202601179001112200120010020000123451234567818',
        ruc_emisor: '1790011122001',
        razon_social_emisor: 'PROVEEDOR S.A.',
        importe_total: 115.0,
        numero_autorizacion:
          '0506202601179001112200120010020000123451234567818',
        fecha_emision: new Date(2026, 5, 5),
        url_xml: null,
      },
    ]);

    const xml = await service.generarAts('empresa-uuid', 2026, 6);

    expect(xml).toBeDefined();
    expect(typeof xml).toBe('string');
    expect(xml).toContain('<AnexoTransaccionalID>');
    expect(xml).toContain('<IdProv>1792345678001</IdProv>');
    expect(xml).toContain('<RazonSocial>EMPRESA PRUEBA S.A.</RazonSocial>');
    // Verificar que existan las compras
    expect(xml).toContain('<compras>');
    expect(xml).toContain('<idProv>1790011122001</idProv>');
    // Verificar que existan las ventas
    expect(xml).toContain('<ventas>');
    expect(xml).toContain('<idCliente>1790011122001</idCliente>');
    // Verificar anulados
    expect(xml).toContain('<anulados>');
    expect(xml).toContain('<secuencialInicio>000000011</secuencialInicio>');
  });
});
