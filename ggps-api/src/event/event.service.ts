import { Body, ForbiddenException, HttpException, HttpStatus, Injectable, Post } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeleteDto, EntryDto, EventDto, MinMaxCoordinatesDto } from './dto';
import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { AuthService } from 'src/auth/auth.service';
import { MessageService } from "src/message/message.service";
import { TokenDto } from 'src/auth/dto';

@Injectable()
export class EventService {

    constructor(private prisma: PrismaService, private auth:AuthService, private message:MessageService){}
    async create(dto: EventDto){
        const user = await this.auth.getUserFromToken(dto.token);
        if (!user) {
            throw new ForbiddenException('User not found');
        }

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
            if (dto.createChatroom){
                const chatroom = await this.message.createChatroom({eventId:event.id.toString()});
            }
            this.createEntry({eventId:event.id.toString(), status:'organizer', token:dto.token});


            return event;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError ) {
                if (error.code === 'P2002'){
                    throw new ForbiddenException('Error');
                }
            }  
            throw error;
        }
    }


    async find(id: number) {
        try {
            const event = await this.prisma.event.findUnique({
                where: { id: id },
            });
            if (!event) {
                throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
            }

            const entry = await this.prisma.entry.findFirst({
                where: {
                    eventId: event.id,
                    status: 'organizer'
                }
            });
            
            const user = await this.prisma.user.findFirst({
                where: {
                    id: entry.userId
                }
            });
            if (!user) {
                return event;
            }
            const organizer =  user.username;
            return {
                event,
                organizer,
            };
        } catch (error) {
            throw error;
        }
    }

    async delete(dto: DeleteDto){
        
        try {
            const user = await this.auth.getUserFromToken(dto.token);
            if (!user) {
                throw new ForbiddenException('User not found');
            }
            const event = await this.prisma.event.findUnique({
                where: { id: parseInt(dto.eventId) }
            });
            if (!event) {
                throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
            }
            const entry = await this.prisma.entry.findFirst({
                where: {
                    eventId: event.id,
                    userId: user.id,
                }
            });
            if (!entry || entry.status !== 'organizer') {
                throw new HttpException('User not authorized to delete event', HttpStatus.FORBIDDEN);
            }
            await this.prisma.event.delete({
                where: { id: parseInt(dto.eventId) }
            });
            return event;
        } catch (error) {
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
                throw new HttpException('User already signed up for this event', HttpStatus.BAD_REQUEST);
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
                const existingAccess = await this.message.checkUserAccess(dto.token, event.id);
                if (chatroom && !existingAccess.access){
                    await this.message.giveAccess(dto.token, chatroom.id,dto.status);
                }
            }
            return entry;
        } catch (error) {
            throw error;
        } 
    }

    async deleteEntry(dto: DeleteDto) {
        try {
            const user = await this.auth.getUserFromToken(dto.token);
            const entry = await this.prisma.entry.findFirst({
                where: {
                    eventId: parseInt(dto.eventId),
                    userId: user.id
                }
            });
            if (!entry) {
                throw new HttpException('Entry not found', HttpStatus.NOT_FOUND);
            }
            if (entry.status === 'organizer') {
                throw new HttpException('Organizer cannot delete entry', HttpStatus.FORBIDDEN);
            }
            await this.prisma.entry.delete({
                where: {
                    id: entry.id
                }
            });
            const chatroom = await this.message.getChatroomByEvent(parseInt(dto.eventId));
            if (chatroom){
                await this.message.removeAccess(dto.token, chatroom.id);
            }
            return entry;
        } catch (error) {
            throw error;
        }
    }

    async getByCategoryInRadius(dto: MinMaxCoordinatesDto) {
        const eventsInRadius = await this.getInRadius(dto);
        const events = eventsInRadius.filter(event => event.category === dto.category);
        return events;
    }

    async getBySearchWordInRadius(dto: MinMaxCoordinatesDto) {
        const eventsInRadius = await this.getInRadius(dto);
        const searchWordLower = dto.searchWord.toLowerCase();
        const filteredEvents = eventsInRadius.filter(event => 
            event.title.toLowerCase().includes(searchWordLower) || 
            event.description.toLowerCase().includes(searchWordLower)
        );
        return filteredEvents;
    }

    async getBySearchWordAndOrCategoryInRadius(dto: MinMaxCoordinatesDto) {
        if (!dto.latMax || !dto.latMin || !dto.longMax || !dto.longMin){
            return this.findAll();
        }

        else if (!dto.category && !dto.searchWord) {
            return this.getInRadius(dto);
        }

        else if (!dto.category ) {
            return this.getBySearchWordInRadius(dto);
        }

        else if (!dto.searchWord ) {
            return this.getByCategoryInRadius(dto);
        }
        const eventsInRadius = await this.getInRadius(dto);
            const searchWordLower = dto.searchWord.toLowerCase();
        const filteredEvents = eventsInRadius.filter(event => 
            (event.title.toLowerCase().includes(searchWordLower) || 
            event.description.toLowerCase().includes(searchWordLower)) &&
            event.category === dto.category
        );
        return filteredEvents;
    }

    async getUserEntries(dto: TokenDto) {
        try{
            const user = await this.auth.getUserFromToken(dto.token);
            if (!user) {
                throw new ForbiddenException('User not found');
            }
            const entries = await this.prisma.entry.findMany({
                where: {
                    userId: user.id
                }
            });
            const events = [];
            const organizedEvents = [];

            for (const entry of entries) {
                const event = await this.prisma.event.findUnique({
                    where: { id: entry.eventId }
                });
                if (event && entry.status === 'organizer') {
                    organizedEvents.push(event);
                }
                else if (event) {
                    events.push(event);
                }
            }
            return {events, organizedEvents};
        }catch(error){
            throw error;
        }

    }

    async getUserEntriesByUsername(username: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { username },
            });
    
            if (!user) {
                throw new ForbiddenException('User not found');
            }
    
            const entries = await this.prisma.entry.findMany({
                where: {
                    userId: user.id,
                },
                include: {
                    event: true, 
                },
            });
    
            const organizedEvents = [];
            const events = [];
    
            for (const entry of entries) {
                if (entry.status === 'organizer') {
                    organizedEvents.push(entry.event);
                } else {
                    events.push(entry.event);
                }
            }
    
            return { events, organizedEvents };
        } catch (error) {
            throw error;
        }
    }
    

    async getEntriesByEventId(id: number) {
        try {
            const entries = await this.prisma.entry.findMany({
                where: {
                    eventId: id
                }
            });
            const userIds = entries.map(entry => entry.userId);

            const users = await this.prisma.user.findMany({
                where: {
                    id: { in: userIds }
                },
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true
                }
            });
            const userEntries = entries.map(entry => {
                const user = users.find(user => user.id === entry.userId);
                return {
                    ...user,
                    status: entry.status
                };
            });

            return userEntries;
            
        } catch (error) {
            throw error;
        }
    }
}