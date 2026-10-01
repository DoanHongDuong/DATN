import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { IEncryptionService } from '../../domain/services/encryption.service.interface';

@Injectable()
export class EncryptionService implements IEncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const rawKey =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET') ||
      'datn-secret-key-fallback-32b-length!';

    // Derive a fixed 32-byte key using sha256 to ensure 256-bit key length for AES-256
    this.key = crypto.createHash('sha256').update(rawKey).digest();
  }

  encrypt(text: string): string {
    if (!text) return text;
    try {
      const iv = crypto.randomBytes(12); // 12 bytes recommended for GCM
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Format: enc:v1:hexIV:hexAuthTag:hexEncrypted
      return `enc:v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (error) {
      this.logger.error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  decrypt(cipherText: string): string {
    if (!cipherText) return cipherText;

    // If text is not encrypted (e.g. legacy plain text saved previously), return as-is
    if (!cipherText.startsWith('enc:v1:')) {
      return cipherText;
    }

    try {
      const parts = cipherText.split(':');
      if (parts.length !== 5) {
        return cipherText;
      }

      const iv = Buffer.from(parts[2], 'hex');
      const authTag = Buffer.from(parts[3], 'hex');
      const encrypted = Buffer.from(parts[4], 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      // Do NOT log the content to comply with AGENTS.md security guidelines
      this.logger.warn(`Decryption failed, returning text as-is: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return cipherText;
    }
  }
}
