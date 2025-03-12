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


    async seedEvents(count: number, france: boolean) {
        const gameTitles = [
            "The Legend of Zelda", "Super Mario Bros.", "Minecraft", "Elden Ring",
            "Final Fantasy XIV", "Counter-Strike 2", "League of Legends",
            "Dark Souls", "The Witcher 3", "Overwatch 2", "Dota 2", "Fortnite",
            "Call of Duty: Warzone", "Hollow Knight", "Cyberpunk 2077",
            "Street Fighter 6", "Tekken 8", "Super Smash Bros. Ultimate", "Balatro",
            "Valorant", "Apex Legends", "Rainbow Six Siege", "World of Warcraft",
            "Genshin Impact", "Among Us", "Rocket League", "Dead by Daylight",
            "Mortal Kombat 12", "Resident Evil Village", "FIFA 22", "NBA 2K22",
            "PUBG", "Hearthstone", "Starcraft 3", "Star Wars: The Old Republic",
            "World of Tanks", "World of Warships", "World of Warplanes",
            "World of Warcraft Classic", "World of Warcraft: The Burning Crusade",
            "World of Warcraft: Wrath of the Lich King",
            "Tosser of coin", "RogueTile", "The Elder Scrolls V: Skyrim",
            "Half-Life 2", "Portal 2", "Left 4 Dead 3", "Team Fortress 2",
            "Deathmatch Classic", "Counter-Strike: Global Offensive",
            "Bed Wars", "Sky Wars", "Murder Mystery", "Build Battle",
            "Roblox", "Mario Kart 8", "Dreamworks Kartz", "Garfield Kart",
             "Super Smash Bros. Melee", "Super Smash Bros. Brawl",
              "Super Smash Bros. 64", "Smash4", "Super Smash Bros. Ultimate",
               "Super Smash Bros. Ultimate", "Super Smash Bros. Ultimate", "Super Smash Bros. Ultimate",
                "Super Smash Bros. Ultimate", "Super Smash Bros. Ultimate", "Super Smash Bros. Ultimate"
        ];
    
        const users = await this.prisma.user.findMany();

        if (users.length === 0) {
            throw new Error("No users found in database.");
        }
    
        const tasks = Array.from({ length: count }).map(async () => {
            const randomUser = users[Math.floor(Math.random() * users.length)];
    
            const loginResponse = await this.auth.login({
                email: randomUser.email,
                password: 'azerty',
            });
    
            const beginDate = faker.date.future();
            const durationHours = Math.random() * (5 * 24 - 8) + 8;
            const endDate = new Date(beginDate.getTime() + durationHours * 60 * 60 * 1000);
    
            const token = loginResponse.token;
            const gameTitle = gameTitles[Math.floor(Math.random() * gameTitles.length)];
    
            let latitude, longitude, city, zipCode, country;
            if (france) {
                latitude = (Math.random() * (51.1 - 41.0) + 41.0).toFixed(6);
                longitude = (Math.random() * (9.6 - (-5.2)) + (-5.2)).toFixed(6);
                city = faker.location.city();
                zipCode = faker.location.zipCode('#####');
                country = "France";
            } else {
                latitude = faker.location.latitude().toString();
                longitude = faker.location.longitude().toString();
                city = faker.location.city();
                zipCode = faker.location.zipCode();
                country = faker.location.country();
            }
    
            const dto: EventDto = {
                title: `Tournament in ${gameTitle}`,
                description: `An amazing event for ${gameTitle} fans!`,
                beginDate: beginDate.toISOString(),
                endDate: endDate.toISOString(),
                street: faker.location.street(),
                number: faker.location.buildingNumber().toString(),
                city,
                zipCode,
                country,
                latitude,
                longitude,
                category: ['Tournament', 'Event', 'Lan', 'Speedrunning event', 'Esport Event', 'Convention'][
                    Math.floor(Math.random() * 6)
                ],
                token,
                createChatroom: true,
            };
    
            try {
                await this.eventService.create(dto);
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    if (error.code === 'P2002') {
                        console.warn('Duplicate entry skipped');
                    }
                }
            }
        });
    
        await Promise.allSettled(tasks);
    }
    
    
}