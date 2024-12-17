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
            eventId: parseInt(dto.eventId)
        }

    });
    if (!user) {
        throw new ForbiddenException('User not found');
    }

    if (!chatroom) {
        throw new ForbiddenException('Chatroom not found');
    }

    
    const existingAccess = await this.checkUserAccess(dto.token, chatroom.id);


    if (!existingAccess) {
      throw new ForbiddenException('User does not have access to this chatroom');
    }

    const message = await this.prisma.message.create({
      data: {
        chatroom: {
          connect: {
            id: chatroom.id,
          },
        },
        content: dto.content,
        user: {
          connect: {
            id: user.id,
          },
        },
        pinned: false, 
      },
    });
    
  

    return { message, username: user.username };
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

  async getChatroomByEvent(eventId: number) {
    const chatroom = await this.prisma.chatroom.findUnique({
      where: {
        eventId: eventId,
      },
    });

    if (!chatroom) {
      return null;
    }

    return chatroom;
  }

  async getMessagesByChatroom(eventId: string) {
    
    const chatroom = await this.prisma.chatroom.findFirst({
        where: {
            eventId: parseInt(eventId),
        },
    });

    if (!chatroom) {
        throw new ForbiddenException('No chatroom found for this event');
    }

    
    const messages = await this.prisma.message.findMany({
        where: {
            chatroomId: chatroom.id,
        },
        orderBy: {
            createdAt: 'asc',
        },
    });

    if (!messages || messages.length === 0) {
        throw new ForbiddenException('No messages found for this chatroom');
    }

    const messagesWithUsernames = [];
    for (const message of messages) {
        const sender = await this.prisma.user.findUnique({
            where: { id: message.userId },
            select: { username: true },
        });

        messagesWithUsernames.push({
            message: message,
            username: sender?.username || "Unknown User", 
        });
    }

    return messagesWithUsernames;
}


  async giveAccess(token: string, chatroomId: number, role: string) {
    const user = await this.auth.getUserFromToken(token);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const chatroom = await this.prisma.chatroom.findUnique({
      where: {
        id: chatroomId,
      },
    });

    if (!chatroom) {
      throw new ForbiddenException('Chatroom not found');
    }

    const existingAccess = await this.checkUserAccess(token, chatroomId);


    if (existingAccess) {
      throw new ForbiddenException('User already has access to this chatroom');
    }

    const access = await this.prisma.access.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        chatroom: {
          connect: {
            id: chatroom.id,
          },
        },
        role: role,
      },
    });

    return access;
  }
  
  async checkUserAccess(token: string, chatroomId: number) {
    const user = await this.auth.getUserFromToken(token);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const access = await this.prisma.access.findFirst({
      where: {
        userId: user.id,
        chatroomId: chatroomId,
      },
    });

    return access;
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
