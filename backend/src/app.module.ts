import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { AuthModule } from './modules/auth/infrastructure/auth.module';
import { AssessmentModule } from './modules/assessment/infrastructure/assessment.module';
import { JournalModule } from './modules/journal/infrastructure/journal.module';
import { ChatModule } from './modules/chat/infrastructure/chat.module';
import { VolunteerModule } from './modules/volunteer/infrastructure/volunteer.module';
import { AdminModule } from './modules/admin/infrastructure/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailModule,
    AuthModule,
    AssessmentModule,
    JournalModule,
    ChatModule,
    VolunteerModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
