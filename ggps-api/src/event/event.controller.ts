import { Body, Controller, ParseIntPipe, Post, Req, UseGuards, HttpCode } from "@nestjs/common";
import { EventService }from './event.service';
import { EventDto, MinMaxCoordinatesDto } from "./dto";
import { AuthGuard } from "src/auth/auth.guard";

@Controller('event')
export class EventController {
    constructor(private eventService : EventService){
    }

    @Post('create')
    @UseGuards(AuthGuard)
    create(@Body() dto: EventDto){
        return this.eventService.create(dto);
    };

    @Post('getAll')
    @UseGuards(AuthGuard)
    @HttpCode(200)
    getAllEvents() {
        return this.eventService.findAll();
    }

    @Post('getInRadius')
    @UseGuards(AuthGuard)
    @HttpCode(200)
    getInRadius(@Body() dto:MinMaxCoordinatesDto) {
        return this.eventService.getInRadius(dto);
    }

}

