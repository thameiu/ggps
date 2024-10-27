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
                    beginDate: new Date(dto.beginDate),
                    endDate: new Date(dto.endDate),
                    street: dto.street,
                    number: dto.number,
                    city: dto.city,
                    zipCode: dto.zipCode,
                    country: dto.country
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
