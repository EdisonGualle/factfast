export class ValidadorIdentificacion {
  /**
   * Valida una cédula ecuatoriana (10 dígitos) usando el algoritmo de Módulo 10.
   */
  static validarCedula(cedula: string): boolean {
    if (!/^\d{10}$/.test(cedula)) return false;

    const provincia = parseInt(cedula.substring(0, 2), 10);
    // Provincias del 1 al 24, o 30 para consulados en el exterior
    if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

    const tercerDigito = parseInt(cedula.substring(2, 3), 10);
    // Para personas naturales, el tercer dígito debe ser menor a 6
    if (tercerDigito >= 6) return false;

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
      if (valor >= 10) {
        valor -= 9;
      }
      suma += valor;
    }

    const verificadorCalculado = (10 - (suma % 10)) % 10;
    const verificadorReal = parseInt(cedula.charAt(9), 10);

    return verificadorCalculado === verificadorReal;
  }

  /**
   * Valida un RUC ecuatoriano (13 dígitos) para personas naturales, jurídicas y públicas.
   */
  static validarRuc(ruc: string): boolean {
    if (!/^\d{13}$/.test(ruc)) return false;

    // Los últimos tres dígitos deben ser un establecimiento válido (001, 002, etc.)
    const establecimiento = ruc.substring(10, 13);
    if (establecimiento === '000') return false;

    const provincia = parseInt(ruc.substring(0, 2), 10);
    if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

    const tercerDigito = parseInt(ruc.substring(2, 3), 10);

    // Case 1: RUC de sociedad privada o extranjera (Tercer dígito = 9)
    if (tercerDigito === 9) {
      const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0;
      for (let i = 0; i < 9; i++) {
        suma += parseInt(ruc.charAt(i), 10) * coeficientes[i];
      }
      const residuo = suma % 11;
      const verificadorCalculado = residuo === 0 ? 0 : 11 - residuo;
      const verificadorReal = parseInt(ruc.charAt(9), 10);
      return verificadorCalculado === verificadorReal;
    }

    // Case 2: RUC de entidad pública (Tercer dígito = 6)
    if (tercerDigito === 6) {
      const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
      let suma = 0;
      for (let i = 0; i < 8; i++) {
        suma += parseInt(ruc.charAt(i), 10) * coeficientes[i];
      }
      const residuo = suma % 11;
      const verificadorCalculado = residuo === 0 ? 0 : 11 - residuo;
      const verificadorReal = parseInt(ruc.charAt(8), 10);
      return verificadorCalculado === verificadorReal;
    }

    // Case 3: RUC de persona natural (Tercer dígito < 6)
    if (tercerDigito < 6) {
      // Los primeros 10 dígitos deben formar una cédula de identidad válida
      return this.validarCedula(ruc.substring(0, 10));
    }

    return false;
  }

  /**
   * Valida cualquier identificación ecuatoriana según su tipo.
   * SRI Tipo de identificación (Tabla 6):
   * '04' = RUC
   * '05' = Cédula
   * '06' = Pasaporte / '07' = Consumidor Final / '08' = Identificación del Exterior
   */
  static validar(tipo: string, identificacion: string): boolean {
    if (tipo === '04') {
      return this.validarRuc(identificacion);
    }
    if (tipo === '05') {
      return this.validarCedula(identificacion);
    }
    if (tipo === '07') {
      return identificacion === '9999999999999'; // Consumidor final oficial
    }
    // Pasaportes e identificaciones del exterior no tienen formato matemático estricto predecible
    if (tipo === '06' || tipo === '08') {
      return identificacion.length >= 3 && identificacion.length <= 20;
    }
    return false;
  }
}
