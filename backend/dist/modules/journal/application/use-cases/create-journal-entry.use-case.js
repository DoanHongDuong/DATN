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
const config_1 = require("@nestjs/config");
const journal_repository_interface_1 = require("../../domain/repositories/journal.repository.interface");
const encryption_service_1 = require("../../infrastructure/ai/encryption.service");
const create_notification_use_case_1 = require("../../../notification/application/use-cases/create-notification.use-case");
exports.AI_SENTIMENT_SERVICE = 'IAiSentimentService';
let CreateJournalEntryUseCase = class CreateJournalEntryUseCase {
    journalRepository;
    aiSentimentService;
    encryptionService;
    configService;
    createNotificationUseCase;
    constructor(journalRepository, aiSentimentService, encryptionService, configService, createNotificationUseCase) {
        this.journalRepository = journalRepository;
        this.aiSentimentService = aiSentimentService;
        this.encryptionService = encryptionService;
        this.configService = configService;
        this.createNotificationUseCase = createNotificationUseCase;
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
        const response = {
            ...entry,
            content: dto.content,
            suggestedResourceCategory: sentiment.suggestedResourceCategory,
        };
        if (sentiment.sentimentLabel === 'crisis') {
            const rawHotline = this.configService.get('EMERGENCY_HOTLINE')?.replace(/^["']|["']$/g, '').trim();
            response.emergencyHotline = (rawHotline && rawHotline !== '1900 6789') ? rawHotline : '0979877220';
            if (this.createNotificationUseCase) {
                await this.createNotificationUseCase.execute({
                    userId,
                    title: 'Cảnh báo sức khỏe cảm xúc',
                    content: 'Hệ thống nhận thấy bạn đang trải qua cảm xúc căng thẳng hoặc khủng hoảng. Đừng ngần ngại liên hệ hotline khẩn cấp hoặc yêu cầu hỗ trợ từ tình nguyện viên.',
                    type: 'CRISIS_ALERT',
                }).catch(() => null);
            }
        }
        return response;
    }
};
exports.CreateJournalEntryUseCase = CreateJournalEntryUseCase;
exports.CreateJournalEntryUseCase = CreateJournalEntryUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(journal_repository_interface_1.JOURNAL_REPOSITORY)),
    __param(1, (0, common_1.Inject)(exports.AI_SENTIMENT_SERVICE)),
    __param(4, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, Object, encryption_service_1.EncryptionService,
        config_1.ConfigService,
        create_notification_use_case_1.CreateNotificationUseCase])
], CreateJournalEntryUseCase);
//# sourceMappingURL=create-journal-entry.use-case.js.map