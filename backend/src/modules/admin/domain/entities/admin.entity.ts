export interface PendingVolunteerProfileEntity {
  id: string;
  userId: string;
  specialization: string | null;
  bio: string | null;
  certificateUrl: string | null;
  isVerified: boolean;
  isOnline: boolean;
  createdAt: Date;
  user: {
    fullName: string;
    email: string;
  };
}

export interface AdminUserEntity {
  id: string;
  role: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedUsersResult {
  items: AdminUserEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
