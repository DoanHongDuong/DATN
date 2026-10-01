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
exports.JournalController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/presentation/guards/jwt-auth.guard");
const create_journal_entry_use_case_1 = require("../application/use-cases/create-journal-entry.use-case");
const get_journal_entries_use_case_1 = require("../application/use-cases/get-journal-entries.use-case");
const update_journal_entry_use_case_1 = require("../application/use-cases/update-journal-entry.use-case");
const delete_journal_entry_use_case_1 = require("../application/use-cases/delete-journal-entry.use-case");
const suggest_resources_use_case_1 = require("../application/use-cases/suggest-resources.use-case");
const create_journal_entry_dto_1 = require("../application/dto/create-journal-entry.dto");
const update_journal_entry_dto_1 = require("../application/dto/update-journal-entry.dto");
let JournalController = class JournalController {
    createJournalEntryUseCase;
    getJournalEntriesUseCase;
    updateJournalEntryUseCase;
    deleteJournalEntryUseCase;
    suggestResourcesUseCase;
    constructor(createJournalEntryUseCase, getJournalEntriesUseCase, updateJournalEntryUseCase, deleteJournalEntryUseCase, suggestResourcesUseCase) {
        this.createJournalEntryUseCase = createJournalEntryUseCase;
        this.getJournalEntriesUseCase = getJournalEntriesUseCase;
        this.updateJournalEntryUseCase = updateJournalEntryUseCase;
        this.deleteJournalEntryUseCase = deleteJournalEntryUseCase;
        this.suggestResourcesUseCase = suggestResourcesUseCase;
    }
    async create(req, dto) {
        return this.createJournalEntryUseCase.execute(req.user.userId, dto);
    }
    async findAll(req, page, limit) {
        return this.getJournalEntriesUseCase.execute(req.user.userId, page, limit);
    }
    async getHistory(req, page, limit) {
        return this.getJournalEntriesUseCase.execute(req.user.userId, page, limit);
    }
    getResources(category) {
        return this.suggestResourcesUseCase.execute(category);
    }
    async update(req, id, dto) {
        return this.updateJournalEntryUseCase.execute(req.user.userId, id, dto);
    }
    async remove(req, id) {
        return this.deleteJournalEntryUseCase.execute(req.user.userId, id);
    }
};
exports.JournalController = JournalController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_journal_entry_dto_1.CreateJournalEntryDto]),
    __metadata("design:returntype", Promise)
], JournalController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], JournalController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], JournalController.prototype, "getHistory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('resources'),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JournalController.prototype, "getResources", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_journal_entry_dto_1.UpdateJournalEntryDto]),
    __metadata("design:returntype", Promise)
], JournalController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], JournalController.prototype, "remove", null);
exports.JournalController = JournalController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('journal'),
    __metadata("design:paramtypes", [create_journal_entry_use_case_1.CreateJournalEntryUseCase,
        get_journal_entries_use_case_1.GetJournalEntriesUseCase,
        update_journal_entry_use_case_1.UpdateJournalEntryUseCase,
        delete_journal_entry_use_case_1.DeleteJournalEntryUseCase,
        suggest_resources_use_case_1.SuggestResourcesUseCase])
], JournalController);
//# sourceMappingURL=journal.controller.js.map