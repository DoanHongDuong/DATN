"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("../../auth/infrastructure/auth.module");
const journal_controller_1 = require("../presentation/journal.controller");
const journal_prisma_repository_1 = require("./persistence/journal.prisma.repository");
const ai_sentiment_service_1 = require("./ai/ai-sentiment.service");
const journal_repository_interface_1 = require("../domain/repositories/journal.repository.interface");
const create_journal_entry_use_case_1 = require("../application/use-cases/create-journal-entry.use-case");
const create_journal_entry_use_case_2 = require("../application/use-cases/create-journal-entry.use-case");
const get_journal_entries_use_case_1 = require("../application/use-cases/get-journal-entries.use-case");
const update_journal_entry_use_case_1 = require("../application/use-cases/update-journal-entry.use-case");
const delete_journal_entry_use_case_1 = require("../application/use-cases/delete-journal-entry.use-case");
const suggest_resources_use_case_1 = require("../application/use-cases/suggest-resources.use-case");
const encryption_service_1 = require("./ai/encryption.service");
const encryption_service_interface_1 = require("../domain/services/encryption.service.interface");
let JournalModule = class JournalModule {
};
exports.JournalModule = JournalModule;
exports.JournalModule = JournalModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            config_1.ConfigModule,
        ],
        controllers: [journal_controller_1.JournalController],
        providers: [
            encryption_service_1.EncryptionService,
            {
                provide: encryption_service_interface_1.ENCRYPTION_SERVICE,
                useExisting: encryption_service_1.EncryptionService,
            },
            {
                provide: journal_repository_interface_1.JOURNAL_REPOSITORY,
                useClass: journal_prisma_repository_1.JournalPrismaRepository,
            },
            {
                provide: create_journal_entry_use_case_1.AI_SENTIMENT_SERVICE,
                useClass: ai_sentiment_service_1.AiSentimentService,
            },
            create_journal_entry_use_case_2.CreateJournalEntryUseCase,
            get_journal_entries_use_case_1.GetJournalEntriesUseCase,
            update_journal_entry_use_case_1.UpdateJournalEntryUseCase,
            delete_journal_entry_use_case_1.DeleteJournalEntryUseCase,
            suggest_resources_use_case_1.SuggestResourcesUseCase,
        ],
        exports: [encryption_service_1.EncryptionService],
    })
], JournalModule);
//# sourceMappingURL=journal.module.js.map