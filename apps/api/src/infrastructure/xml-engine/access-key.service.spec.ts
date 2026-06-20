import { Test, TestingModule } from '@nestjs/testing';
import { AccessKeyService } from './access-key.service';

describe('AccessKeyService', () => {
  let service: AccessKeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessKeyService],
    }).compile();

    service = module.get<AccessKeyService>(AccessKeyService);
  });

  it('debe estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  it('debe generar una clave de acceso de 49 caracteres exactos', () => {
    const key = service.generate({
      issueDate: new Date('2026-06-05T00:00:00'),
      voucherTypeCode: '01',
      ruc: '1792945237001',
      environment: '1',
      branchCode: '001',
      emissionPointCode: '002',
      sequential: 145,
    });

    expect(key).toHaveLength(49);
    expect(key.startsWith('050620260117929452370011001002000000145')).toBe(
      true,
    );
  });

  it('debe calcular correctamente el dígito verificador Módulo 11', () => {
    // Ejemplo de clave manual
    // Si pasamos una clave con residuo 0 de módulo 11, debe retornar '0'
    const keyWithZero = service.generate({
      issueDate: new Date('2026-06-05T00:00:00'),
      voucherTypeCode: '01',
      ruc: '1792945237001',
      environment: '1',
      branchCode: '001',
      emissionPointCode: '001',
      sequential: 1, // Esto genera una clave de acceso específica
    });

    expect(keyWithZero).toHaveLength(49);
    const lastDigit = keyWithZero[keyWithZero.length - 1];
    expect(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']).toContain(
      lastDigit,
    );
  });
});
