export interface UserProfileEntity {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: Date;
}
