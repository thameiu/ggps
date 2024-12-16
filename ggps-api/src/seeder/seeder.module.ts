import { forwardRef, Global, Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { EventModule } from 'src/event/event.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [EventModule, AuthModule],
    providers: [SeederService],
    exports: [SeederService]

})
export class SeederModule {}