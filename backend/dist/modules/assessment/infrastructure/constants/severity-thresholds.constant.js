"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEVERITY_THRESHOLDS = void 0;
exports.getSeverityLevel = getSeverityLevel;
const client_1 = require("@prisma/client");
exports.SEVERITY_THRESHOLDS = {
    PHQ9: [
        { min: 0, max: 4, level: client_1.SeverityLevel.MINIMAL },
        { min: 5, max: 9, level: client_1.SeverityLevel.MILD },
        { min: 10, max: 14, level: client_1.SeverityLevel.MODERATE },
        { min: 15, max: 19, level: client_1.SeverityLevel.MODERATELY_SEVERE },
        { min: 20, max: 27, level: client_1.SeverityLevel.SEVERE },
    ],
    GAD7: [
        { min: 0, max: 4, level: client_1.SeverityLevel.MINIMAL },
        { min: 5, max: 9, level: client_1.SeverityLevel.MILD },
        { min: 10, max: 14, level: client_1.SeverityLevel.MODERATE },
        { min: 15, max: 21, level: client_1.SeverityLevel.SEVERE },
    ],
};
function getSeverityLevel(testCode, totalScore) {
    const thresholds = exports.SEVERITY_THRESHOLDS[testCode];
    if (!thresholds) {
        return client_1.SeverityLevel.MINIMAL;
    }
    for (const threshold of thresholds) {
        if (totalScore >= threshold.min && totalScore <= threshold.max) {
            return threshold.level;
        }
    }
    return client_1.SeverityLevel.SEVERE;
}
//# sourceMappingURL=severity-thresholds.constant.js.map