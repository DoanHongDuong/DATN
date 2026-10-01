import { SeverityLevel, PriorityLevel } from '@prisma/client';

/**
 * Bảng ánh xạ severity_level → priority_level
 * Theo business rule đã chốt trong AGENTS.md:
 * - MINIMAL / MILD → LOW
 * - MODERATE → MEDIUM
 * - MODERATELY_SEVERE → HIGH
 * - SEVERE → CRITICAL
 */
export const SEVERITY_TO_PRIORITY_MAP: Record<SeverityLevel, PriorityLevel> = {
  [SeverityLevel.MINIMAL]: PriorityLevel.LOW,
  [SeverityLevel.MILD]: PriorityLevel.LOW,
  [SeverityLevel.MODERATE]: PriorityLevel.MEDIUM,
  [SeverityLevel.MODERATELY_SEVERE]: PriorityLevel.HIGH,
  [SeverityLevel.SEVERE]: PriorityLevel.CRITICAL,
};

/** Giá trị mặc định khi user chưa từng làm test */
export const DEFAULT_PRIORITY_LEVEL = PriorityLevel.MEDIUM;
