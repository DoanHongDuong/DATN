import { GetAuditLogsUseCase } from './get-audit-logs.use-case';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';

describe('GetAuditLogsUseCase', () => {
  let useCase: GetAuditLogsUseCase;
  let adminRepo: jest.Mocked<IAdminRepository>;

  beforeEach(() => {
    adminRepo = {
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
    };

    useCase = new GetAuditLogsUseCase(adminRepo);
  });

  it('should return paginated audit logs with default pagination', async () => {
    const mockResult = {
      data: [
        {
          id: 'log-1',
          actorId: 'admin-1',
          action: 'APPROVE_VOLUNTEER',
          targetId: 'user-1',
          description: 'Duyệt hồ sơ tình nguyện viên',
          createdAt: new Date(),
          actor: {
            fullName: 'Admin User',
            email: 'admin@mindcare.vn',
          },
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };

    adminRepo.getAuditLogs.mockResolvedValue(mockResult);

    const result = await useCase.execute({});

    expect(adminRepo.getAuditLogs).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      action: undefined,
      from: undefined,
      to: undefined,
    });
    expect(result).toEqual(mockResult);
  });

  it('should pass filters to repository correctly', async () => {
    const mockResult = {
      data: [],
      meta: {
        page: 2,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };

    adminRepo.getAuditLogs.mockResolvedValue(mockResult);

    const result = await useCase.execute({
      page: 2,
      limit: 20,
      action: 'LOCK_USER',
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-18T23:59:59.999Z',
    });

    expect(adminRepo.getAuditLogs).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      action: 'LOCK_USER',
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-18T23:59:59.999Z',
    });
    expect(result).toEqual(mockResult);
  });
});
