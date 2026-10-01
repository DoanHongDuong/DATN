import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth/infrastructure/auth.module';
import { AssessmentModule } from './modules/assessment/infrastructure/assessment.module';
import { JournalModule } from './modules/journal/infrastructure/journal.module';
import { ChatModule } from './modules/chat/infrastructure/chat.module';


@Module({
  imports: [PrismaModule, AuthModule, AssessmentModule, JournalModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
