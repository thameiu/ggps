import {
  Body,
  Controller,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  HttpCode,
  Get,
  Query,
  Param,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { EventService } from './event.service';
import { DeleteDto, EntryDto, EventDto, MinMaxCoordinatesDto } from './dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { TokenDto } from 'src/auth/dto';
import { AuthService } from 'src/auth/auth.service';

@Controller('event')
export class EventController {
  private rateLimit = new Map<string, number>(); // Store the last request timestamp for each user
  private readonly RATE_LIMIT_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

  constructor(private eventService: EventService, private auth: AuthService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Req() req, @Body() dto: EventDto) {
    const user = await this.auth.getUserFromToken(req.headers.authorization);

    if (!user) {
      throw new BadRequestException('User not authenticated.');
    }

    const now = Date.now();
    const lastRequestTime = this.rateLimit.get(user.username);

    if (lastRequestTime && now - lastRequestTime < this.RATE_LIMIT_INTERVAL) {
      const remainingTime = Math.ceil(
        (this.RATE_LIMIT_INTERVAL - (now - lastRequestTime)) / 1000,
      );
      throw new BadRequestException(
        `You can create an event after ${remainingTime} seconds.`,
      );
    }

    this.rateLimit.set(user.username, now);

    return this.eventService.create(dto);
  }

  @Get('id/:id')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  getEventById(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.find(id);
  }

  @Get()
  @UseGuards(AuthGuard)
  @HttpCode(200)
  getInRadius(@Query() dto: MinMaxCoordinatesDto) {
    return this.eventService.getBySearchWordAndOrCategoryInRadius(dto);
  }

  @Get('entries/:id')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  getEntriesByEventId(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.getEntriesByEventId(id);
  }

  @Delete()
  @UseGuards(AuthGuard)
  @HttpCode(204)
  delete(@Body() dto: DeleteDto) {
    return this.eventService.delete(dto);
  }

  @Post('entry')
  @UseGuards(AuthGuard)
  @HttpCode(201)
  createEntry(@Body() dto: EntryDto) {
    return this.eventService.createEntry(dto);
  }

  @Delete('entry')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  deleteEntry(@Body() dto: DeleteDto) {
    return this.eventService.deleteEntry(dto);
  }

  @Get('userEntries')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  getUserEntries(@Query() dto: TokenDto) {
    return this.eventService.getUserEntries(dto);
  }

  @Get(':username/entries')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  getUserEntriesByUsername(@Param('username') username: string) {
    return this.eventService.getUserEntriesByUsername(username);
  }
}
