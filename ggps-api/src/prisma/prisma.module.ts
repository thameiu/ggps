import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SeederModule } from 'src/seeder/seeder.module';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
