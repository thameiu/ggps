import { Injectable } from '@nestjs/common';
import { EventDto } from '../event/dto/event.dto';
import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { EventService } from 'src/event/event.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from 'src/auth/dto';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class SeederService {

    constructor( private eventService:EventService, private prisma:PrismaService, private auth:AuthService) {
    }

    async seedUsers(count:number){
        for (let i=0; i < count; i++){

            const dto: AuthDto = {
                email:faker.internet.email(),
                username:faker.internet.username(),
                firstName:faker.person.firstName(),
                lastName:faker.person.lastName(),
                password:'azerty',
            }
            try {
                await this.auth.signup(dto);
                
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


    async seedEvents(count: number) {
        for (let i = 0; i < count; i++) {
            
            const users = await this.prisma.user.findMany();

            const randomUser = users[Math.floor(Math.random() * users.length)];
            const loginResponse = await this.auth.login({
            email: randomUser.email,
            password: 'azerty',
            });

            const token = loginResponse.token;

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
            category: ['Tournament', 'Event', 'Lan', 'Speedrunning event', 'Esport Event', 'Convention'][
                Math.floor(Math.random() * 6)
            ], 
            token,
            };

            try {
            // Create the event using the event service
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