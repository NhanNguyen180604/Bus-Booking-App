import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { MyMailerModule } from 'src/my-mailer/my-mailer.module';

@Module({
  imports: [MyMailerModule],
  providers: [TasksService]
})
export class TasksModule { }
