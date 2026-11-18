export interface UserProfileEntity {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
}
