import { forwardRef, Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { AuthModule } from 'src/auth/auth.module';
import { MessageService } from 'src/message/message.service';


@Module({
  imports: [AuthModule], 
  controllers: [EventController],
  providers: [EventService, MessageService],
  exports:[EventService]
})

export class EventModule {}