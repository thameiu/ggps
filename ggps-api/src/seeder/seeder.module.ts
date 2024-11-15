import { forwardRef, Global, Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { EventModule } from 'src/event/event.module';

@Module({
    imports: [EventModule],
    providers: [SeederService],
    exports: [SeederService]

})
export class SeederModule {}