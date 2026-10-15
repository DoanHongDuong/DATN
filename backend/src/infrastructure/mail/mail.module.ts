import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MAIL_SERVICE, NodemailerMailService } from './mail.service';


@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MAIL_SERVICE,
      useClass: NodemailerMailService,
    },
  ],
  exports: [MAIL_SERVICE],
})
export class MailModule {}

