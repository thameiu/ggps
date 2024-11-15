import { Injectable } from '@nestjs/common';
import { EventDto } from '../event/dto/event.dto';
import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { EventService } from 'src/event/event.service';

@Injectable()
export class SeederService {

    constructor( private eventService:EventService) {
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
                await this.eventService.create(dto);
               
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
