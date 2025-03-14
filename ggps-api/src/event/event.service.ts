import { BadRequestException, Body, ForbiddenException, HttpException, HttpStatus, Injectable, Post } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CheckEntryDto, DeleteDto, EntryDto, EventDto, EventFetchDto, RemoveEntryDto, UpdateEntryStatusDto } from './dto';
import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { AuthService } from 'src/auth/auth.service';
import { MessageService } from "src/message/message.service";
import { TokenDto } from 'src/auth/dto';
import { log } from 'console';

@Injectable()
export class EventService {

    constructor(private prisma: PrismaService, private auth:AuthService, private message:MessageService){}
    async create(dto: EventDto){
        const user = await this.auth.getUserFromToken(dto.token);
        if (!user) {
            throw new ForbiddenException('User not found');
        }

        const currentDateTime = new Date();
        const beginDate = new Date(dto.beginDate);
        const endDate = new Date(dto.endDate);

        if (beginDate <= currentDateTime) {
            throw new BadRequestException('Begin date must be after the current datetime.');
        }

        if (endDate <= beginDate) {
            throw new BadRequestException('End date must be after begin date.');
        }

        try {
            const event = await this.prisma.event.create({
                data: {
                    title: dto.title,
                    description: dto.description,
                    beginDate: beginDate,
                    endDate: endDate,
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

    async getInRadius(dto:EventFetchDto) {
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
    
            if (!user) {
                throw new ForbiddenException('User not found');
            }
    
            const event = await this.prisma.event.findUnique({
                where: {
                    id: parseInt(dto.eventId),
                },
            });
    
            if (!event) {
                throw new ForbiddenException('Event not found');
            }
    
            const now = new Date();
            if (new Date(event.beginDate) < now) {
                throw new HttpException('Cannot sign up for an event that has already started.', HttpStatus.BAD_REQUEST);
            }
    
            const entryFound = await this.prisma.entry.findFirst({
                where: {
                    eventId: parseInt(dto.eventId),
                    userId: user.id,
                },
            });
    
            if (entryFound) {
                throw new HttpException('User already signed up for this event.', HttpStatus.BAD_REQUEST);
            }
    
            const entry = await this.prisma.entry.create({
                data: {
                    userId: user.id,
                    eventId: event.id,
                    status: dto.status,
                },
            });
    
            const chatroom = await this.message.getChatroomByEvent(event.id);
    
            if (chatroom) {
                const existingAccess = await this.message.checkUserAccess(dto.token, event.id);
                if (chatroom && !existingAccess.access) {
                    await this.message.giveAccess(dto.token, chatroom.id, 'write');
                }
            }
    
            return entry;
        } catch (error) {
            throw error;
        }
    }

    async hasUserEntry(dto: CheckEntryDto) {
        try {
            const user = await this.auth.getUserFromToken(dto.token);
            if (!user) {
                throw new ForbiddenException('User not found');
            }

            const entry = await this.prisma.entry.findFirst({
                where: {
                    eventId: parseInt(dto.eventId),
                    userId: user.id,
                },
            });

            if (!entry) {
                throw new ForbiddenException('User does not have an entry for this event');
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

    async removeUserEntry(dto: RemoveEntryDto) {
        try {
            const user = await this.auth.getUserFromToken(dto.token);
            const entry = await this.prisma.entry.findFirst({
                where: {
                    eventId: parseInt(dto.eventId),
                    userId: user.id
                }
            });
            if (!entry || (entry.status !== 'organizer' && entry.status !== 'admin')) {
                throw new HttpException('User is not allowed this entry.', HttpStatus.NOT_FOUND);
            }
            const userToRemove = await this.prisma.user.findFirst({
                where: {
                    username: dto.username
                }
            });
            if (!userToRemove) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }
            const userEntry = await this.prisma.entry.findFirst({
                where: {
                    eventId: parseInt(dto.eventId),
                    userId: userToRemove.id
                }
            });
            if (userEntry.status === 'organizer' || userEntry.status === 'admin') {
                throw new HttpException('Cannot remove organizer or admin', HttpStatus.FORBIDDEN);
            }
            
            await this.prisma.entry.delete({
                where: {
                    id: userEntry.id
                }
            });
            const chatroom = await this.message.getChatroomByEvent(parseInt(dto.eventId));
            if (chatroom){
                await this.message.removeUserAccess(userToRemove.username, chatroom.id);
            }
            return entry;
        } catch (error) {
            throw error;
        }
    }

    async updateUserEntryStatus(dto: UpdateEntryStatusDto) {
        try {
            const user = await this.auth.getUserFromToken(dto.token);
    
            // Check if the user has permission (must be organizer or admin)
            const entry = await this.prisma.entry.findFirst({
                where: {
                    eventId: parseInt(dto.eventId),
                    userId: user.id
                }
            });
    
            if (!entry || (entry.status !== 'organizer' && entry.status !== 'admin')) {
                throw new HttpException('User is not allowed to modify entries.', HttpStatus.FORBIDDEN);
            }
    
            // Find the user to update
            const userToUpdate = await this.prisma.user.findFirst({
                where: {
                    username: dto.username
                }
            });
    
            if(user.id === userToUpdate.id){
                throw new HttpException('Cannot change own status', HttpStatus.FORBIDDEN);
            }
            
            if (!userToUpdate) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }
    
            // Find the entry of the user being updated
            const userEntry = await this.prisma.entry.findFirst({
                where: {
                    eventId: parseInt(dto.eventId),
                    userId: userToUpdate.id
                }
            });
    
            if (!userEntry) {
                throw new HttpException('Entry not found', HttpStatus.NOT_FOUND);
            }
    
            // Allowed statuses
            const allowedStatuses = ['accepted', 'pending', 'refused', 'admin', 'banned'];
            if (!allowedStatuses.includes(dto.status)) {
                throw new HttpException('Invalid status', HttpStatus.BAD_REQUEST);
            }

            if (userEntry.status === 'organizer') {
                throw new HttpException('Cannot change organizer status', HttpStatus.FORBIDDEN);
            }

            if (userEntry.status === 'admin' && entry.status !== 'organizer') {
                throw new HttpException('Only organizer can change admin status', HttpStatus.FORBIDDEN);
            }
    
            // // Prevent demoting organizers or admins unless banning
            // if ((userEntry.status === 'organizer' || userEntry.status === 'admin') 
            //     && dto.status !== 'banned') {
            //     throw new HttpException('Cannot change organizer or admin status unless banning', HttpStatus.FORBIDDEN);
            // }
    
            // Update the status
            const updatedEntry = await this.prisma.entry.update({
                where: { id: userEntry.id },
                data: { status: dto.status }
            });
    
            // Determine new role in chat
            let newRole: string | null = null;
            if (
                (userEntry.status === 'pending' && dto.status === 'accepted') ||
                (userEntry.status === 'banned' && dto.status === 'accepted') ||
                (userEntry.status === 'admin' && dto.status === 'accepted')
            ) {
                newRole = 'write';
            } else if (dto.status === 'admin') {
                newRole = 'admin';
            } else if (dto.status === 'banned' || dto.status === 'pending') {
                newRole = 'none';
            }
    
            // Update chat access if necessary
            if (newRole !== null) {
                const chatroom = await this.message.getChatroomByEvent(parseInt(dto.eventId));
                if (chatroom) {
                    await this.message.updateUserAccess({
                        token: dto.token,
                        username: userToUpdate.username,
                        eventId: dto.eventId,
                        role: newRole
                    });
                }
            }
    
            return updatedEntry;
        } catch (error) {
            throw error;
        }
    }
    
    
    async getByCategoryInRadius(dto: EventFetchDto) {
        let events = await this.getInRadius(dto);
        events = events.filter(event => event.category === dto.category);
    
        if (dto.pastEvents) {
            const now = new Date();
            events = events.filter(event => new Date(event.beginDate) < now);
        }
        else{
            const now = new Date();
            events = events.filter(event => new Date(event.beginDate) > now);
            events.sort((a, b) => new Date(a.beginDate).getTime() - new Date(b.beginDate).getTime());

        }

        return events;
    }

    
    async getBySearchWordInRadius(dto: EventFetchDto) {
        const eventsInRadius = await this.getInRadius(dto);
        const searchWordLower = dto.searchWord.toLowerCase();
        let filteredEvents = eventsInRadius.filter(event => 
            event.title.toLowerCase().includes(searchWordLower) || 
            event.description.toLowerCase().includes(searchWordLower)
        );
        if (dto.pastEvents) {
            const now = new Date();
            filteredEvents = filteredEvents.filter(event => new Date(event.beginDate) < now);

        }
        else{
            const now = new Date();
            filteredEvents = filteredEvents.filter(event => new Date(event.beginDate) > now);
            filteredEvents.sort((a, b) => new Date(a.beginDate).getTime() - new Date(b.beginDate).getTime());

        }
        return filteredEvents;
    }

    async getBySearchWordAndCategoryInRadius(dto: EventFetchDto){
        const eventsInRadius = await this.getInRadius(dto);
        const searchWordLower = dto.searchWord.toLowerCase();
        let filteredEvents = eventsInRadius.filter(event => 
            (event.title.toLowerCase().includes(searchWordLower) || 
            event.description.toLowerCase().includes(searchWordLower))
            && event.category === dto.category
        );
        if (dto.pastEvents) {
            const now = new Date();
            filteredEvents = filteredEvents.filter(event => new Date(event.beginDate) < now);


        }
        else{
            const now = new Date();
            filteredEvents = filteredEvents.filter(event => new Date(event.beginDate) > now);
            filteredEvents.sort((a, b) => new Date(a.beginDate).getTime() - new Date(b.beginDate).getTime());

        }
        return filteredEvents;
    }

    async getFilteredEvents(dto: EventFetchDto) {
        if (!dto.latMax || !dto.latMin || !dto.longMax || !dto.longMin) {
            return this.findAll();
        } else if (!dto.category && !dto.searchWord && !dto.recommend) {
            return this.getInRadius(dto);
        } else if (!dto.category && !dto.recommend) {
            return this.getBySearchWordInRadius(dto);
        } else if (!dto.searchWord && !dto.recommend) {
            return this.getByCategoryInRadius(dto);
        } else if (dto.searchWord && dto.category && !dto.recommend) {
            return this.getBySearchWordAndCategoryInRadius(dto);
        }
    
        let eventsInRadius = await this.getInRadius(dto);
        const searchWordLower = dto.searchWord.toLowerCase();
    
        let returnEvents = [];
    
        if (dto.recommend) {
    
            if (dto.pastEvents) {
                const now = new Date();
                eventsInRadius = eventsInRadius.filter(event => new Date(event.beginDate) < now);
            }
    
            const bothMatches = [];
            const searchWordOnly = [];
            const categoryOnly = [];
    
            for (const event of eventsInRadius) {
                const matchesSearchWord = event.title.toLowerCase().includes(searchWordLower) || event.description.toLowerCase().includes(searchWordLower);
                const matchesCategory = event.category === dto.category;
    
                if (matchesSearchWord && matchesCategory) {
                    bothMatches.push(event);
                } else if (matchesSearchWord) {
                    searchWordOnly.push(event);
                } else if (matchesCategory) {
                    categoryOnly.push(event);
                }
            }
    
            bothMatches.sort((a, b) => new Date(a.beginDate).getTime() - new Date(b.beginDate).getTime());
            searchWordOnly.sort((a, b) => new Date(a.beginDate).getTime() - new Date(b.beginDate).getTime());
            categoryOnly.sort((a, b) => new Date(a.beginDate).getTime() - new Date(b.beginDate).getTime());
    
            const orderedEvents = [...bothMatches, ...searchWordOnly, ...categoryOnly];
            const existingEventIds = new Set(orderedEvents.map(event => event.id));
            const additionalEvents = eventsInRadius.filter(event => !existingEventIds.has(event.id));
    
            additionalEvents.sort((a, b) => new Date(a.beginDate).getTime() - new Date(b.beginDate).getTime());
    
            returnEvents = [...orderedEvents, ...additionalEvents].slice(0, 1000);
        }
    
        return returnEvents.slice(0, dto.recommend ? 1000 : 150);
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
            // Find the chatroom associated with the event
            const chatroom = await this.prisma.chatroom.findUnique({
                where: { eventId: id },
                select: { id: true }
            });
    
            const entries = await this.prisma.entry.findMany({
                where: { eventId: id }
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
    
            let chatroomAccess = {};
            
            if (chatroom) {
                const accessList = await this.prisma.access.findMany({
                    where: { chatroomId: chatroom.id },
                    select: {
                        userId: true,
                        role: true
                    }
                });
                chatroomAccess = Object.fromEntries(accessList.map(a => [a.userId, a.role]));
            }
    
            return entries.map(entry => {
                const user = users.find(user => user.id === entry.userId);
                return {
                    ...user,
                    status: entry.status,
                    role: chatroomAccess[entry.userId] || null // Include role if exists, else null
                };
            });
    
        } catch (error) {
            throw error;
        }
    }
    
    
}