import { Body, ForbiddenException, Injectable, Post } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EntryDto, EventDto, MinMaxCoordinatesDto } from './dto';
import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { AuthService } from 'src/auth/auth.service';
import { MessageService } from "src/message/message.service";

@Injectable()
export class EventService {

    constructor(private prisma: PrismaService, private auth:AuthService, private message:MessageService){}

    async create(dto: EventDto){
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
                    country: dto.country,
                    latitude: parseFloat(dto.latitude),
                    longitude: parseFloat(dto.longitude),
                    category: dto.category,
                    game: dto.game?dto.game:null,
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

    async findAll() {
        try {
            const events = await this.prisma.event.findMany();
            return events;
        } catch (error) {
            throw error;
        }
    }

    async getInRadius(dto:MinMaxCoordinatesDto) {
        const latMin:number =parseFloat(dto.latMin);
        const longMin:number =parseFloat(dto.longMin);
        const latMax:number=parseFloat(dto.latMax);
        const longMax:number=parseFloat(dto.longMax);
        try {
            const events = await this.prisma.event.findMany({
                where: {
                    latitude: {
                        gte: latMin,
                        lte: latMax
                    },
                    longitude: {
                        gte: longMin,
                        lte: longMax
                    }
                }
            });
            return events;
        } catch (error) {
            throw error;
        }
    }


    async createEntry(dto: EntryDto) {
        try {

            const user = await this.auth.getUserFromToken(dto.token);
            const event = await this.prisma.event.findUnique({
                where: {
                    id: parseInt(dto.eventId)
                }
            })
            const entryFound = await this.prisma.entry.findFirst({
                where: {
                    eventId: parseInt(dto.eventId),
                    userId: user.id,
                }
            })
            if (!user) {
                throw new ForbiddenException('User not found');
            }
            if (!event) {
                throw new ForbiddenException('Event not found');
            }
            if (entryFound) {
                throw new ForbiddenException('This user has already signed up for this event');
            }
            const entry = await this.prisma.entry.create({
                data: {
                    userId: user.id,
                    eventId: event.id,
                    status: dto.status,
                }
            });

            const chatroom = await this.message.getChatroomByEvent(event.id);
            if (chatroom){
                await this.message.giveAccess(dto.token, chatroom.id, 'participant');
            }
            return entry;
        } catch (error) {
            throw error;
        }
    }

}