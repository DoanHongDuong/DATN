"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PRIORITY_LEVEL = exports.SEVERITY_TO_PRIORITY_MAP = void 0;
const client_1 = require("@prisma/client");
exports.SEVERITY_TO_PRIORITY_MAP = {
    [client_1.SeverityLevel.MINIMAL]: client_1.PriorityLevel.LOW,
    [client_1.SeverityLevel.MILD]: client_1.PriorityLevel.LOW,
    [client_1.SeverityLevel.MODERATE]: client_1.PriorityLevel.MEDIUM,
    [client_1.SeverityLevel.MODERATELY_SEVERE]: client_1.PriorityLevel.HIGH,
    [client_1.SeverityLevel.SEVERE]: client_1.PriorityLevel.CRITICAL,
};
exports.DEFAULT_PRIORITY_LEVEL = client_1.PriorityLevel.MEDIUM;
//# sourceMappingURL=priority-mapping.constant.js.map