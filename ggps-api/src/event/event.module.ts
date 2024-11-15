import { forwardRef, Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [AuthModule], 
  controllers: [EventController],
  providers: [EventService],
  exports:[EventService]
})

export class EventModule {}