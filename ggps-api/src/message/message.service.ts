import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateMessageDto, CreateChatroomDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
// import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessageService {

  constructor(private prisma: PrismaService, private auth: AuthService){}

  async create(dto: CreateMessageDto) {
    const user = await this.auth.getUserFromToken(dto.token);

    const chatroom = await this.prisma.chatroom.findUnique({
        where: {
            id: dto.chatroomId
        }

    });
    if (!user) {
        throw new ForbiddenException('User not found');
    }

    if (!chatroom) {
        throw new ForbiddenException('Chatroom not found');
    }

  }

  async createChatroom(dto: CreateChatroomDto) {
    const event = await this.prisma.event.findUnique({
        where: {
            id: parseInt(dto.eventId)
        }
    })

    if (!event) {
        throw new ForbiddenException('Event not found');
    }

    const chatroom = await this.prisma.chatroom.create({
      data: {
          event: {
              connect: {
                  id: event.id,
              },
          },
      },
  });
  

    return chatroom;
  }

  findAll() {
    return `This action returns all message`;
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  // update(id: number, updateMessageDto: UpdateMessageDto) {
  //   return `This action updates a #${id} message`;
  // }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }
}
