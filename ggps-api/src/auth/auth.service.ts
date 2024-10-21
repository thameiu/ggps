import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from 'argon2'

@Injectable()
export class AuthService{
    constructor(private prisma: PrismaService){}

    login(){
        return { msg:"i have log"}
    }

    async signup(dto: AuthDto){
        console.log(dto)
        const hash = await argon.hash(dto.password);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                username: dto.username,
                hash,
            }
        });
        return user;
    }
}
