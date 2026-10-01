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
exports.CreateJournalEntryUseCase = exports.AI_SENTIMENT_SERVICE = void 0;
const common_1 = require("@nestjs/common");
const journal_repository_interface_1 = require("../../domain/repositories/journal.repository.interface");
const encryption_service_1 = require("../../infrastructure/ai/encryption.service");
exports.AI_SENTIMENT_SERVICE = 'IAiSentimentService';
let CreateJournalEntryUseCase = class CreateJournalEntryUseCase {
    journalRepository;
    aiSentimentService;
    encryptionService;
    constructor(journalRepository, aiSentimentService, encryptionService) {
        this.journalRepository = journalRepository;
        this.aiSentimentService = aiSentimentService;
        this.encryptionService = encryptionService;
    }
    async execute(userId, dto) {
        const sentiment = await this.aiSentimentService.analyze(dto.content);
        const encryptedContent = this.encryptionService.encrypt(dto.content);
        const entry = await this.journalRepository.create({
            userId,
            content: encryptedContent,
            moodEmoji: dto.moodEmoji,
            sentimentLabel: sentiment.sentimentLabel,
            sentimentScore: sentiment.sentimentScore,
        });
        return {
            ...entry,
            content: dto.content,
            suggestedResourceCategory: sentiment.suggestedResourceCategory,
        };
    }
};
exports.CreateJournalEntryUseCase = CreateJournalEntryUseCase;
exports.CreateJournalEntryUseCase = CreateJournalEntryUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(journal_repository_interface_1.JOURNAL_REPOSITORY)),
    __param(1, (0, common_1.Inject)(exports.AI_SENTIMENT_SERVICE)),
    __metadata("design:paramtypes", [Object, Object, encryption_service_1.EncryptionService])
], CreateJournalEntryUseCase);
//# sourceMappingURL=create-journal-entry.use-case.js.map