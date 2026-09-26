import { SeverityLevel } from '@prisma/client';

export const SEVERITY_THRESHOLDS = {
  PHQ9: [
    { min: 0, max: 4, level: SeverityLevel.MINIMAL },
    { min: 5, max: 9, level: SeverityLevel.MILD },
    { min: 10, max: 14, level: SeverityLevel.MODERATE },
    { min: 15, max: 19, level: SeverityLevel.MODERATELY_SEVERE },
    { min: 20, max: 27, level: SeverityLevel.SEVERE },
  ],
  GAD7: [
    { min: 0, max: 4, level: SeverityLevel.MINIMAL },
    { min: 5, max: 9, level: SeverityLevel.MILD },
    { min: 10, max: 14, level: SeverityLevel.MODERATE },
    { min: 15, max: 21, level: SeverityLevel.SEVERE },
  ],
};

export function getSeverityLevel(testCode: string, totalScore: number): SeverityLevel {
  const thresholds = SEVERITY_THRESHOLDS[testCode as keyof typeof SEVERITY_THRESHOLDS];
  if (!thresholds) {
    return SeverityLevel.MINIMAL; // Fallback
  }

  for (const threshold of thresholds) {
    if (totalScore >= threshold.min && totalScore <= threshold.max) {
      return threshold.level;
    }
  }

  return SeverityLevel.SEVERE; // Fallback for out of upper bound
}
