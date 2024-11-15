import { Body, ForbiddenException, Injectable, Post } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventDto, MinMaxCoordinatesDto } from './dto';
import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

@Injectable()
export class EventService {

    constructor(private prisma: PrismaService){}

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

    async seedEvents(count: number) {
        for (let i = 0; i < count; i++) {
            const dto: EventDto = {
                title: faker.lorem.sentence(),
                description: faker.lorem.paragraph(),
                beginDate: faker.date.future().toISOString(),
                endDate: faker.date.future().toISOString(),
                street: faker.location.street(),
                number: faker.location.buildingNumber().toString(),
                city: faker.location.city(),
                zipCode: faker.location.zipCode(),
                country: faker.location.country(),
                latitude: faker.location.latitude().toString(),
                longitude: faker.location.longitude().toString(),
            };
            try {
                await this.create(dto);
               
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2002') {
                        throw new ForbiddenException('Duplicate entry');
                    }
                }
                throw error;
            }
        }
    }
}