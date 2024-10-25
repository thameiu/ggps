import { Body, ForbiddenException, Injectable, Post } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventService {

    constructor(private prisma: PrismaService){}

    async create(dto: EventDto){
        console.log({dto})

        try {
            const event = await this.prisma.event.create({
                data: {
                    title: dto.title,
                    description: dto.description,
                    beginDate: dto.beginDate,
                    endDate: dto.endDate,
                }
            });
            return event;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError ) {
                if (error.code === 'P2002'){
                    throw new ForbiddenException('Username or email taken');
                }
            }  
            throw error;
        }
    }
    
}
