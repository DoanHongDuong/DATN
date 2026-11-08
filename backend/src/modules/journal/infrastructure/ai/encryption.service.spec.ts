import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'ENCRYPTION_KEY') return 'my-ultra-secure-test-key-32bytes!';
        return undefined;
      }),
    } as unknown as ConfigService;

    service = new EncryptionService(configService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encrypt plain text and produce format enc:v1:iv:tag:cipher', () => {
    const plainText = 'Hôm nay tôi cảm thấy rất thoải mái và vui vẻ.';
    const encrypted = service.encrypt(plainText);

    expect(encrypted).not.toEqual(plainText);
    expect(encrypted.startsWith('enc:v1:')).toBe(true);
    expect(encrypted.split(':')).toHaveLength(5);
  });

  it('should decrypt encrypted text back to original plain text', () => {
    const plainText = 'Hôm nay tôi cảm thấy rất thoải mái và vui vẻ.';
    const encrypted = service.encrypt(plainText);
    const decrypted = service.decrypt(encrypted);

    expect(decrypted).toEqual(plainText);
  });

  it('should return unencrypted legacy text as-is without error', () => {
    const legacyText = 'Nhật ký cũ lưu plain text trước khi có mã hoá.';
    const result = service.decrypt(legacyText);

    expect(result).toEqual(legacyText);
  });

  it('should decrypt text encrypted with fallback JWT_SECRET key', () => {
    // Simulate legacy service using JWT_SECRET
    const legacyConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'old-jwt-secret';
        return undefined;
      }),
    } as unknown as ConfigService;
    const legacyService = new EncryptionService(legacyConfigService);
    const legacyEncrypted = legacyService.encrypt('Nội dung bảo mật cũ');

    // Current service with dedicated JOURNAL_ENCRYPTION_KEY and JWT_SECRET as fallback
    const currentConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JOURNAL_ENCRYPTION_KEY') return 'new-dedicated-key-32bytes-long!';
        if (key === 'JWT_SECRET') return 'old-jwt-secret';
        return undefined;
      }),
    } as unknown as ConfigService;
    const currentService = new EncryptionService(currentConfigService);

    const decrypted = currentService.decrypt(legacyEncrypted);
    expect(decrypted).toEqual('Nội dung bảo mật cũ');
  });
});
