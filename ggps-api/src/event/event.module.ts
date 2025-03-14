import { forwardRef, Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { AuthModule } from 'src/auth/auth.module';
import { MessageService } from 'src/message/message.service';
import { EventGateway } from './event.gateway';
import { MessageController } from 'src/message/message.controller';


@Module({
  imports: [AuthModule], 
  controllers: [EventController],
  providers: [EventService, MessageService, EventGateway, MessageController, EventController],
  exports:[EventService]
})

export class EventModule {}