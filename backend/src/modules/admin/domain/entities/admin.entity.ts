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

export interface AdminRelaxationResourceEntity {
  id: string;
  title: string;
  type: string;
  url: string;
  durationSeconds: number | null;
  category: string;
  createdAt: Date;
}

export interface AuditLogEntity {
  id: string;
  actorId: string;
  action: string;
  targetId: string | null;
  description: string | null;
  createdAt: Date;
  actor: {
    fullName: string;
    email: string;
  };
}

export interface PaginatedAuditLogsResult {
  data: AuditLogEntity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SystemStatsEntity {
  users: {
    total: number;
    members: number;
    volunteers: number;
    admins: number;
    active: number;
    blocked: number;
    onlineVolunteers: number;
    pendingVolunteers: number;
  };
  sessions: {
    total: number;
    waiting: number;
    active: number;
    closed: number;
    totalFeedbacks: number;
    averageRating: number;
  };
  assessments: {
    total: number;
    severityDistribution: {
      minimal: number;
      mild: number;
      moderate: number;
      moderatelySevere: number;
      severe: number;
    };
  };
  journals: {
    total: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
      crisis: number;
    };
  };
  resources: {
    total: number;
  };
  recentActivity: Array<{
    date: string;
    sessions: number;
    assessments: number;
    journals: number;
  }>;
}
