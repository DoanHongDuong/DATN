import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssessmentController } from '../presentation/assessment.controller';
import { AssessmentPrismaRepository } from './persistence/assessment.prisma.repository';
import { ListTestsUseCase } from '../application/use-cases/list-tests.use-case';
import { GetTestQuestionsUseCase } from '../application/use-cases/get-test-questions.use-case';
import { SubmitTestUseCase } from '../application/use-cases/submit-test.use-case';
import { GetTestHistoryUseCase } from '../application/use-cases/get-test-history.use-case';
import { AuthModule } from '../../auth/infrastructure/auth.module';

@Module({
  imports: [
    AuthModule,   // exports JwtModule → provides JwtService for JwtAuthGuard
    ConfigModule, // provides ConfigService for JwtAuthGuard
  ],
  controllers: [AssessmentController],
  providers: [
    {
      provide: 'IAssessmentRepository',
      useClass: AssessmentPrismaRepository,
    },
    ListTestsUseCase,
    GetTestQuestionsUseCase,
    SubmitTestUseCase,
    GetTestHistoryUseCase,
  ],
})
export class AssessmentModule {}
