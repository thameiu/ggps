import { Body, Controller, ParseIntPipe, Post, Req } from "@nestjs/common";
import { EventService }from './event.service';
import { EventDto } from "./dto";

@Controller('event')
export class EventController {
    constructor(private eventService : EventService){
    }

    @Post('create')
    login(@Body() dto: EventDto){
        return this.eventService.create(dto);
    };
    @Post('getAll')
    getAllEvents() {
        return this.eventService.findAll();
    }

}
