import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SeederModule } from './seeder/seeder.module';
import { SeederService } from './seeder/seeder.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private seeder: SeederService) {
    // this.seeder.seedEvents(99);
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
