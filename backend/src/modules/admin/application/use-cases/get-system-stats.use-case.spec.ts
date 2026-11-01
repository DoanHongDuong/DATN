import { GetSystemStatsUseCase } from './get-system-stats.use-case';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { SystemStatsEntity } from '../../domain/entities/admin.entity';

describe('GetSystemStatsUseCase', () => {
  let useCase: GetSystemStatsUseCase;
  let adminRepository: jest.Mocked<IAdminRepository>;

  const mockStats: SystemStatsEntity = {
    users: {
      total: 100,
      members: 80,
      volunteers: 18,
      admins: 2,
      active: 95,
      blocked: 5,
      onlineVolunteers: 4,
      pendingVolunteers: 2,
    },
    sessions: {
      total: 50,
      waiting: 2,
      active: 3,
      closed: 45,
      totalFeedbacks: 30,
      averageRating: 4.8,
    },
    assessments: {
      total: 120,
      severityDistribution: {
        minimal: 40,
        mild: 35,
        moderate: 25,
        moderatelySevere: 15,
        severe: 5,
      },
    },
    journals: {
      total: 300,
      sentimentDistribution: {
        positive: 150,
        neutral: 80,
        negative: 60,
        crisis: 10,
      },
    },
    resources: {
      total: 15,
    },
    recentActivity: [
      {
        date: '2026-11-01',
        sessions: 5,
        assessments: 12,
        journals: 20,
      },
    ],
  };

  beforeEach(() => {
    adminRepository = {
      getPendingVolunteers: jest.fn(),
      findVolunteerProfileById: jest.fn(),
      approveVolunteer: jest.fn(),
      rejectVolunteer: jest.fn(),
      getUsers: jest.fn(),
      findUserById: jest.fn(),
      updateUserStatus: jest.fn(),
      getAllResources: jest.fn(),
      findResourceById: jest.fn(),
      createResource: jest.fn(),
      updateResource: jest.fn(),
      deleteResource: jest.fn(),
      getAuditLogs: jest.fn(),
      getSystemStats: jest.fn().mockResolvedValue(mockStats),
    };

    useCase = new GetSystemStatsUseCase(adminRepository);
  });

  it('should return aggregated system statistics from repository', async () => {
    const result = await useCase.execute();

    expect(adminRepository.getSystemStats).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockStats);
    expect(result.users.total).toBe(100);
    expect(result.sessions.averageRating).toBe(4.8);
    expect(result.assessments.total).toBe(120);
  });
});

