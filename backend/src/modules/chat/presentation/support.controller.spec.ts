import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { SupportController } from './support.controller';

describe('SupportController', () => {
  let controller: SupportController;
  let mockConfigService: { get: jest.Mock };

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<SupportController>(SupportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /support/emergency', () => {
    it('should return hotline when EMERGENCY_HOTLINE is configured', () => {
      mockConfigService.get.mockReturnValue('1900 6789');

      const result = controller.getEmergencyHotline();

      expect(mockConfigService.get).toHaveBeenCalledWith('EMERGENCY_HOTLINE');
      expect(result).toEqual({ hotline: '1900 6789' });
    });

    it('should throw NotFoundException when EMERGENCY_HOTLINE is not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(() => controller.getEmergencyHotline()).toThrow(NotFoundException);
      expect(() => controller.getEmergencyHotline()).toThrow('Hotline khẩn cấp chưa được cấu hình');
    });

    it('should throw NotFoundException when EMERGENCY_HOTLINE is an empty string', () => {
      mockConfigService.get.mockReturnValue('   ');

      expect(() => controller.getEmergencyHotline()).toThrow(NotFoundException);
    });
  });
});

