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
});
