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
exports.UpdateJournalEntryUseCase = void 0;
const common_1 = require("@nestjs/common");
const journal_repository_interface_1 = require("../../domain/repositories/journal.repository.interface");
const encryption_service_1 = require("../../infrastructure/ai/encryption.service");
const create_journal_entry_use_case_1 = require("./create-journal-entry.use-case");
let UpdateJournalEntryUseCase = class UpdateJournalEntryUseCase {
    journalRepository;
    aiSentimentService;
    encryptionService;
    constructor(journalRepository, aiSentimentService, encryptionService) {
        this.journalRepository = journalRepository;
        this.aiSentimentService = aiSentimentService;
        this.encryptionService = encryptionService;
    }
    async execute(userId, entryId, dto) {
        const existing = await this.journalRepository.findById(entryId);
        if (!existing) {
            throw new common_1.NotFoundException('Journal entry not found');
        }
        if (existing.userId !== userId) {
            throw new common_1.ForbiddenException('You can only update your own journal entries');
        }
        let sentimentLabel = existing.sentimentLabel;
        let sentimentScore = existing.sentimentScore;
        let suggestedResourceCategory = null;
        const existingContentDecrypted = this.encryptionService.decrypt(existing.content);
        if (dto.content && dto.content !== existingContentDecrypted) {
            const sentiment = await this.aiSentimentService.analyze(dto.content);
            sentimentLabel = sentiment.sentimentLabel;
            sentimentScore = sentiment.sentimentScore;
            suggestedResourceCategory = sentiment.suggestedResourceCategory;
        }
        const contentToSave = dto.content ? this.encryptionService.encrypt(dto.content) : undefined;
        const updated = await this.journalRepository.update(entryId, {
            content: contentToSave,
            moodEmoji: dto.moodEmoji,
            sentimentLabel,
            sentimentScore,
        });
        return {
            ...updated,
            content: dto.content ?? existingContentDecrypted,
            suggestedResourceCategory,
        };
    }
};
exports.UpdateJournalEntryUseCase = UpdateJournalEntryUseCase;
exports.UpdateJournalEntryUseCase = UpdateJournalEntryUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(journal_repository_interface_1.JOURNAL_REPOSITORY)),
    __param(1, (0, common_1.Inject)(create_journal_entry_use_case_1.AI_SENTIMENT_SERVICE)),
    __metadata("design:paramtypes", [Object, Object, encryption_service_1.EncryptionService])
], UpdateJournalEntryUseCase);
//# sourceMappingURL=update-journal-entry.use-case.js.map