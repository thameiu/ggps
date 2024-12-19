import { Body, Controller, ParseIntPipe, Post, Req, UseGuards, HttpCode, Get, Query, Head, Param, Delete } from "@nestjs/common";
import { EventService }from './event.service';
import { DeleteEntryDto, EntryDto, EventDto, MinMaxCoordinatesDto } from "./dto";
import { AuthGuard } from "src/auth/auth.guard";
import { ad } from "@faker-js/faker/dist/airline-BLb3y-7w";
import { TokenDto } from "src/auth/dto";

@Controller('event')
export class EventController {
    constructor(private eventService : EventService){
    }

    @Post()
    @UseGuards(AuthGuard)
    create(@Body() dto: EventDto){
        return this.eventService.create(dto);
    };
    
    @Get('id/:id')
    @UseGuards(AuthGuard)
    @HttpCode(200)
    getEventById(@Param('id', ParseIntPipe) id: number) {
        return this.eventService.find(id);
    }

    @Get()
    @UseGuards(AuthGuard)
    @HttpCode(200)
    getInRadius(@Query() dto:MinMaxCoordinatesDto) {
        return this.eventService.getBySearchWordAndOrCategoryInRadius(dto);
    }

    @Post('entry')
    @UseGuards(AuthGuard)
    @HttpCode(201)
    createEntry(@Body() dto:EntryDto){ 
        return this.eventService.createEntry(dto);
    }

    @Delete('entry')
    @UseGuards(AuthGuard)
    @HttpCode(200)
    deleteEntry(@Body() dto:DeleteEntryDto) {
        return this.eventService.deleteEntry(dto);
    }
    

    @Get('userEntries')
    @UseGuards(AuthGuard)
    @HttpCode(200)
    getUserEntries(@Query() dto: TokenDto){ 
        return this.eventService.getUserEntries(dto);
    }


}
