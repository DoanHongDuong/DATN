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
exports.SuggestResourcesUseCase = void 0;
const common_1 = require("@nestjs/common");
const journal_repository_interface_1 = require("../../domain/repositories/journal.repository.interface");
let SuggestResourcesUseCase = class SuggestResourcesUseCase {
    journalRepository;
    constructor(journalRepository) {
        this.journalRepository = journalRepository;
    }
    async execute(category) {
        let resources = [];
        const normalizedCategory = category ? category.trim().toLowerCase() : '';
        if (normalizedCategory && normalizedCategory !== 'none') {
            resources = await this.journalRepository.findRelaxationResourcesByCategory(normalizedCategory);
        }
        if (resources.length === 0) {
            resources = await this.journalRepository.findAllRelaxationResources();
        }
        if (resources.length <= 1) {
            return resources;
        }
        const shuffled = [...resources].sort(() => 0.5 - Math.random());
        const maxAvailable = Math.min(3, shuffled.length);
        const count = Math.floor(Math.random() * maxAvailable) + 1;
        return shuffled.slice(0, count);
    }
};
exports.SuggestResourcesUseCase = SuggestResourcesUseCase;
exports.SuggestResourcesUseCase = SuggestResourcesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(journal_repository_interface_1.JOURNAL_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], SuggestResourcesUseCase);
//# sourceMappingURL=suggest-resources.use-case.js.map