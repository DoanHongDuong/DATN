"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetJournalHistoryUseCase = exports.GetJournalEntriesUseCase = void 0;
const common_1 = require("@nestjs/common");
const journal_repository_interface_1 = require("../../domain/repositories/journal.repository.interface");
const encryption_service_1 = require("../../infrastructure/ai/encryption.service");
let GetJournalEntriesUseCase = class GetJournalEntriesUseCase {
    journalRepository;
    encryptionService;
    constructor(journalRepository, encryptionService) {
        this.journalRepository = journalRepository;
        this.encryptionService = encryptionService;
    }
    async execute(userId, page, limit) {
        const skip = (page - 1) * limit;
        const [entries, total] = await Promise.all([
            this.journalRepository.findByUserId(userId, skip, limit),
            this.journalRepository.countByUserId(userId),
        ]);
        const decryptedEntries = entries.map((entry) => ({
            ...entry,
            content: this.encryptionService.decrypt(entry.content),
        }));
        return {
            data: decryptedEntries,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
};
exports.GetJournalEntriesUseCase = GetJournalEntriesUseCase;
exports.GetJournalHistoryUseCase = GetJournalEntriesUseCase;
exports.GetJournalHistoryUseCase = exports.GetJournalEntriesUseCase = GetJournalEntriesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(journal_repository_interface_1.JOURNAL_REPOSITORY)),
    __metadata("design:paramtypes", [Object, encryption_service_1.EncryptionService])
], GetJournalEntriesUseCase);
//# sourceMappingURL=get-journal-entries.use-case.js.map