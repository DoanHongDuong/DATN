export const ENCRYPTION_SERVICE = 'IEncryptionService';

export interface IEncryptionService {
  encrypt(text: string): string;
  decrypt(cipherText: string): string;
}
