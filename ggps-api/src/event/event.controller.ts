import {
  Body,
  Controller,
  ParseIntPipe,
  Post,
  Put,
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
import { DeleteDto, EntryDto, EventDto, EventFetchDto, RemoveEntryDto, UpdateEntryStatusDto, CheckEntryDto } from './dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { TokenDto } from 'src/auth/dto';
import { AuthService } from 'src/auth/auth.service';

@Controller('event')
export class EventController {
  private fetchRateLimit = new Map<string, number>();
  private createRateLimit = new Map<string, number>();

  private readonly RATE_LIMIT_INTERVAL = 15 * 60 * 1000;
  private readonly FETCH_RATE_LIMIT = 2000; // 2 seconds timeout per user

  constructor(private eventService: EventService, private auth: AuthService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Req() req, @Body() dto: EventDto) {
    const user = await this.auth.getUserFromToken(req.headers.authorization);
  
    if (!user) {
      throw new BadRequestException('User not authenticated.');
    }
    if (!user.verified) {
      throw new BadRequestException('User not verified.');
    }
  
    const now = Date.now();
    const lastCreateTime = this.createRateLimit.get(user.username);
  
    if (lastCreateTime && now - lastCreateTime < this.RATE_LIMIT_INTERVAL) {
      const remainingTime = Math.ceil(
        (this.RATE_LIMIT_INTERVAL - (now - lastCreateTime)) / 1000,
      );
      throw new BadRequestException(
        `You can create an event after ${remainingTime} seconds.`,
      );
    }
  
    try {
      const event = await this.eventService.create(dto);
      this.createRateLimit.set(user.username, now); // Store create event time separately
      return event;
    } catch (error) {
      throw error;
    }
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
  async getInRadius(@Req() req, @Query() dto: EventFetchDto) {
    const user = await this.auth.getUserFromToken(req.headers.authorization);
    if (!user) {
      throw new BadRequestException('User not authenticated.');
    }
  
    const now = Date.now();
    const lastFetchTime = this.fetchRateLimit.get(user.username);
  
    if (lastFetchTime && now - lastFetchTime < this.FETCH_RATE_LIMIT) {
      throw new BadRequestException('Please wait before making another request.');
    }
  
    this.fetchRateLimit.set(user.username, now); // Store fetch event time separately
    return this.eventService.getFilteredEvents(dto);
  }
  
  @Get('entries/:id')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  getEntriesByEventId(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.getEntriesByEventId(id);
  }

  @Get('entry')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async hasUserEntry(@Query() dto: CheckEntryDto) {
    try {
      const user = await this.auth.getUserFromToken(dto.token);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const entry = await this.eventService.hasUserEntry(dto);
      if (!entry) {
        throw new BadRequestException('User does not have an entry for this event');
      }
      return entry;
    } catch (error) {
      throw error;
    }
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

  @Put('entry/user')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async updateUserEntryStatus(@Body() dto: UpdateEntryStatusDto) {
    return this.eventService.updateUserEntryStatus(dto);
  }
  
  @Delete('entry/user')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  removeUserEntry(@Body() dto: RemoveEntryDto) {
    return this.eventService.removeUserEntry(dto);
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
