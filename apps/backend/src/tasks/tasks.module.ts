import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { MyMailerModule } from 'src/my-mailer/my-mailer.module';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [MyMailerModule, StripeModule],
  providers: [TasksService]
})
export class TasksModule { }
