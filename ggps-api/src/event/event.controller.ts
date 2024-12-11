import { Body, Controller, ParseIntPipe, Post, Req, UseGuards, HttpCode, Get, Query, Head, Param } from "@nestjs/common";
import { EventService }from './event.service';
import { EntryDto, EventDto, MinMaxCoordinatesDto } from "./dto";
import { AuthGuard } from "src/auth/auth.guard";
import { ad } from "@faker-js/faker/dist/airline-BLb3y-7w";

@Controller('event')
export class EventController {
    constructor(private eventService : EventService){
    }

    @Post('create')
    @UseGuards(AuthGuard)

    create(@Body() dto: EventDto){
        return this.eventService.create(dto);
    };

    @Get('getAll')
    @UseGuards(AuthGuard)
    @HttpCode(200)
    getAllEvents() {
        return this.eventService.findAll();
    }

    @Get('getInRadius')
    @UseGuards(AuthGuard)
    @HttpCode(200)
    getInRadius(@Query() dto:MinMaxCoordinatesDto) {
        return this.eventService.getInRadius(dto);
    }

    @Get('getByCategoryInRadius')
    @UseGuards(AuthGuard)
    @HttpCode(200)
    getByCategoryInRadius(@Query('category') category: string, @Query() dto: MinMaxCoordinatesDto) {
        return this.eventService.getByCategoryInRadius(category, dto);
    }

    @Get('getBySearchWordInRadius')
    @UseGuards(AuthGuard)
    @HttpCode(200)
    getBySearchWordInRadius(@Query('searchWord') searchWord: string, @Query() dto: MinMaxCoordinatesDto) {
        return this.eventService.getBySearchWordInRadius(searchWord, dto);
    }
    
    @Post('addEntry')
    @UseGuards(AuthGuard)
    @HttpCode(200)
    createEntry(@Body() dto:EntryDto){ 
        return this.eventService.createEntry(dto);
    }

}
