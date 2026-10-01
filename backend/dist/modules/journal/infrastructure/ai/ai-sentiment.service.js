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
var AiSentimentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiSentimentService = exports.SYSTEM_PROMPT = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const genai_1 = require("@google/genai");
exports.SYSTEM_PROMPT = `Phân tích cảm xúc của đoạn nhật ký sau (tiếng Việt), trả về JSON đúng định dạng:
{
  "sentiment_label": "positive" | "neutral" | "negative" | "crisis",
  "sentiment_score": số từ -1.0 đến 1.0,
  "suggested_resource_category": "breathing" | "calm_audio" | "none"
}
Không giải thích gì thêm, chỉ trả về đúng JSON.`;
let AiSentimentService = AiSentimentService_1 = class AiSentimentService {
    configService;
    logger = new common_1.Logger(AiSentimentService_1.name);
    ai = null;
    timeoutMs = 10000;
    model = 'gemini-3.5-flash-lite';
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('GEMINI_API_KEY');
        if (apiKey) {
            this.ai = new genai_1.GoogleGenAI({ apiKey });
        }
        else {
            this.logger.warn('GEMINI_API_KEY is not configured in ConfigService.');
        }
    }
    async analyze(content) {
        const fallbackResult = {
            sentimentLabel: null,
            sentimentScore: null,
            suggestedResourceCategory: null,
        };
        if (!this.ai) {
            this.logger.warn('GoogleGenAI client is not initialized. Skipping sentiment analysis.');
            return fallbackResult;
        }
        try {
            let timeoutHandle;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    reject(new Error('AI sentiment analysis timed out after 10 seconds'));
                }, this.timeoutMs);
            });
            const generatePromise = this.ai.models.generateContent({
                model: this.model,
                contents: `${exports.SYSTEM_PROMPT}\n\nNhật ký: "${content}"`,
                config: { responseMimeType: 'application/json' },
            });
            const response = await Promise.race([generatePromise, timeoutPromise]).finally(() => {
                clearTimeout(timeoutHandle);
            });
            const rawText = response.text?.trim() ?? '{}';
            const cleanJson = rawText
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/, '')
                .replace(/\s*```$/, '');
            const result = JSON.parse(cleanJson);
            return this.validateAndFormatResult(result);
        }
        catch (error) {
            this.logger.error(`AI sentiment analysis failed or timed out: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return fallbackResult;
        }
    }
    validateAndFormatResult(data) {
        const validLabels = ['positive', 'neutral', 'negative', 'crisis'];
        const validCategories = ['breathing', 'calm_audio', 'none'];
        const rawLabel = typeof data.sentiment_label === 'string' ? data.sentiment_label.toLowerCase() : null;
        const sentimentLabel = validLabels.includes(rawLabel) ? rawLabel : null;
        let sentimentScore = null;
        if (typeof data.sentiment_score === 'number' && !Number.isNaN(data.sentiment_score)) {
            sentimentScore = Math.max(-1.0, Math.min(1.0, data.sentiment_score));
        }
        const rawCategory = typeof data.suggested_resource_category === 'string' ? data.suggested_resource_category.toLowerCase() : null;
        const suggestedResourceCategory = validCategories.includes(rawCategory)
            ? rawCategory
            : null;
        return {
            sentimentLabel,
            sentimentScore,
            suggestedResourceCategory,
        };
    }
};
exports.AiSentimentService = AiSentimentService;
exports.AiSentimentService = AiSentimentService = AiSentimentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiSentimentService);
//# sourceMappingURL=ai-sentiment.service.js.map