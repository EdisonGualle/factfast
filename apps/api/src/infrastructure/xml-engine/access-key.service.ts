import { Injectable } from '@nestjs/common';

// Genera la clave de acceso de 49 dígitos según Ficha Técnica SRI v2.26
// Estructura: fechaEmision(8) + tipoComprobante(2) + ruc(13) + ambiente(1)
//             + serie(6) + secuencial(9) + codigoNumerico(8) + tipoEmision(1) + verificador(1)
@Injectable()
export class AccessKeyService {
  generate(params: {
    issueDate: Date;
    voucherTypeCode: string;
    ruc: string;
    environment: '1' | '2';
    branchCode: string;
    emissionPointCode: string;
    sequential: number;
    emissionType?: '1' | '2';
  }): string {
    const date = this.formatDate(params.issueDate);
    const serie = `${params.branchCode}${params.emissionPointCode}`;
    const sequential = String(params.sequential).padStart(9, '0');
    const numericCode = this.randomNumericCode();
    const emissionType = params.emissionType ?? '1';

    const raw =
      date +
      params.voucherTypeCode +
      params.ruc +
      params.environment +
      serie +
      sequential +
      numericCode +
      emissionType;

    const verifier = this.mod11(raw);
    return raw + verifier;
  }

  private formatDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = String(date.getFullYear());
    return d + m + y;
  }

  private randomNumericCode(): string {
    return String(Math.floor(Math.random() * 99_999_999)).padStart(8, '0');
  }

  // Módulo 11 con factor de multiplicación cíclico 2..7
  private mod11(value: string): string {
    const digits = value.split('').map(Number);
    let factor = 2;
    let sum = 0;

    for (let i = digits.length - 1; i >= 0; i--) {
      sum += digits[i] * factor;
      factor = factor >= 7 ? 2 : factor + 1;
    }

    const remainder = sum % 11;
    if (remainder === 0) return '0';
    if (remainder === 1) return '1';
    return String(11 - remainder);
  }
}
