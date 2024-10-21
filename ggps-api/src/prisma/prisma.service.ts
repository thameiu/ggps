import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor() {
        super({
            datasources: {
                db: {
                    url: 'postgresql://postgres:hQ8yyTb4TqxxDMQ@localhost:5434/nest?schema=public'
                }
            }
        })
    }
}
