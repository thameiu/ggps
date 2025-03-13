import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SeederModule } from './seeder/seeder.module';
import { SeederService } from './seeder/seeder.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private seeder: SeederService) {
    // this.seeder.seedUsers(99);
    // this.seeder.seedEvents(1000, true);
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
