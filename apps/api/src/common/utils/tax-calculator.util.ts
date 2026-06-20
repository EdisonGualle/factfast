import { LineaComprobanteDto } from '../dto/solicitud-comprobante.dto';

export class TaxCalculator {
  static readonly IVA_RATES: Record<string, number> = {
    '0': 0, // 0%
    '2': 12, // 12%
    '3': 14, // 14%
    '4': 15, // 15%
    '5': 5, // 5%
    '6': 0, // No objeto de impuesto
    '7': 0, // Exento de IVA
    '8': 8, // 8%
    '10': 13, // 13%
  };

  /**
   * Enriches the line taxes by auto-calculating `tarifa`, `base_imponible`, and `valor`
   * if they are not provided by the client.
   */
  static enriquecerImpuestos(lineas: LineaComprobanteDto[]): void {
    if (!lineas) return;

    for (const linea of lineas) {
      const baseImponibleLinea = Number(
        (linea.cantidad * linea.precio_unitario - linea.descuento).toFixed(2),
      );

      for (const impuesto of linea.impuestos) {
        if (!impuesto.base_imponible || impuesto.base_imponible === 0) {
          impuesto.base_imponible = baseImponibleLinea;
        }

        if (impuesto.codigo_impuesto === '2') {
          // IVA
          const tarifaObj = this.IVA_RATES[impuesto.codigo_porcentaje] ?? 0;
          if (!impuesto.tarifa || impuesto.tarifa === 0) {
            impuesto.tarifa = tarifaObj;
          }
        } else {
          // For ICE and IRBPNR we can't guess the rate easily as it varies heavily by product.
          // If not provided, default to 0 to avoid NaN, though ICE must be provided explicitly.
          if (!impuesto.tarifa) impuesto.tarifa = 0;
        }

        if (!impuesto.valor || impuesto.valor === 0) {
          const calculatedValue =
            (impuesto.base_imponible * impuesto.tarifa) / 100;
          impuesto.valor = Number(calculatedValue.toFixed(2));
        }
      }
    }
  }
}
