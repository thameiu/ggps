import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateMessageDto, CreateChatroomDto, PinMessageDto, UpdateAccessDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
// import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessageService {

  constructor(private prisma: PrismaService, private auth: AuthService){}

  async create(dto: CreateMessageDto): Promise<any> {
    try {
      const user = await this.auth.getUserFromToken(dto.token);

      const event = await this.prisma.event.findUnique({
        where: {
          id: parseInt(dto.eventId)
        }
      });

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

      if (!event) {
        throw new ForbiddenException('Event not found');
      }


      const existingAccess = await this.checkUserAccess(dto.token, event.id);

      if (!existingAccess) {
        throw new ForbiddenException('User does not have access to this chatroom');
      }

      if (existingAccess.access.role!== 'admin' && existingAccess.access.role !== 'organizer' && existingAccess.access.role !== 'write') {
        throw new ForbiddenException('User cannot send messages to this chatroom');
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
    } catch (error) {
      throw new ForbiddenException(error.message);
    }
  }

  async pinMessage(dto: PinMessageDto) {
    const user = await this.auth.getUserFromToken(dto.token);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const message = await this.prisma.message.findUnique({
      where: {
        id: dto.messageId,
      },
    });

    
    if (!message) {
      throw new ForbiddenException('Message not found');
    }

    const chatroom = await this.prisma.chatroom.findUnique({
      where: {
        id: message.chatroomId,
      },
    });

    if (!chatroom) {
      throw new ForbiddenException('Chatroom not found');
    }

    const access = await this.checkUserAccess(dto.token, chatroom.eventId);

    if (!access) {
      throw new ForbiddenException('User does not have access to this chatroom');
    }
    if (access.access.role !== 'organizer' && access.access.role !== 'admin') {
      throw new ForbiddenException('User does not have access to this chatroom');
    }

    const updatedMessage = await this.prisma.message.update({
      where: {
        id: message.id,
      },
      data: {
        pinned: message.pinned ? false : true,
      },
    });

    return {username:user.username,message:updatedMessage};
  }

  async createChatroom(dto: CreateChatroomDto): Promise<any> {
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

  async getMessagesByChatroom(eventId: string): Promise<any> {
    
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

    if (!messages) {
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

    const existingAccess = await this.checkUserAccess(token, chatroom.eventId);


    if (existingAccess.access) {
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


  async removeAccess(token: string, chatroomId: number) {
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

    const existingAccess = await this.prisma.access.findFirst({
      where: {
        userId: user.id,
        chatroomId: chatroomId,
      },
    });

    if (!existingAccess) {
      throw new ForbiddenException('User does not have access to this chatroom');
    }

    await this.prisma.access.delete({
      where: {
        id: existingAccess.id,
      },
    });

    return { message: 'Access removed successfully' };
  }


  async removeUserAccess(username: string, chatroomId: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: username,
      },
    });

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

    const existingAccess = await this.prisma.access.findFirst({
      where: {
        userId: user.id,
        chatroomId: chatroomId,
      },
    });

    if (!existingAccess) {
      throw new ForbiddenException('User does not have access to this chatroom');
    }

    await this.prisma.access.delete({
      where: {
        id: existingAccess.id,
      },
    });

    return { message: 'Access removed successfully' };
  }
  
  
  async checkUserAccess(token: string, eventId: number) {
    try {
      const user = await this.auth.getUserFromToken(token);

      if (!user) {
        throw new ForbiddenException('User not found');
      }

      const event = await this.prisma.event.findUnique({
        where: {
          id: eventId,
        },
      });
      if (!event){
        throw new ForbiddenException('Event not found');
      }

      const chatroom = await this.getChatroomByEvent(eventId);
      if (!chatroom) {
        throw new ForbiddenException('Chatroom not found');
      }

      const access = await this.prisma.access.findFirst({
        where: {
          userId: user.id,
          chatroomId: chatroom.id,
        },
      });

      return {username:user.username,access};
    } catch (error) {
      throw new ForbiddenException(error.message);
    }

  }

  async updateUserAccess(dto: UpdateAccessDto) {

    const token = dto.token;
    const eventId = dto.eventId;
    const username = dto.username;
    const role = dto.role;
    // Step 1: Verify the user's access level using the token
    const user = await this.auth.getUserFromToken(token);
  
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (dto.role !== 'admin' && dto.role !== 'write' && dto.role !== 'read' && dto.role !=='none') {
      throw new ForbiddenException('Invalid role');
    }
  
    // Step 2: Check if the user has 'admin' or 'organizer' role
    const userAccess = await this.prisma.access.findFirst({
      where: {
        userId: user.id,
        role: {
          in: ['admin', 'organizer'],
        },
      },
    });
  
    if (!userAccess) {
      throw new ForbiddenException('User does not have permission to update access');
    }
  
    // Step 3: Find the chatroom associated with the given event ID
    const event = await this.prisma.event.findUnique({
      where: {
        id: parseInt(eventId),
      },
    });
  
    if (!event) {
      throw new ForbiddenException('Event not found');
    }
  
    const chatroom = await this.getChatroomByEvent(parseInt(eventId));
  
    if (!chatroom) {
      throw new ForbiddenException('Chatroom not found');
    }
  
    // Step 4: Verify if the target user has existing access to the chatroom
    const targetUser = await this.prisma.user.findUnique({
      where: {
        username: username,
      },
    });
  
    if (!targetUser) {
      throw new ForbiddenException('Target user not found');
    }
  
    const existingAccess = await this.prisma.access.findFirst({
      where: {
        userId: targetUser.id,
        chatroomId: chatroom.id,
      },
    });
  
    if (!existingAccess) {
      throw new ForbiddenException('Target user does not have access to this chatroom');
    }
  
    // Step 5: Update the role of the target user's access
    const updatedAccess = await this.prisma.access.update({
      where: {
        id: existingAccess.id,
      },
      data: {
        role: role,
      },
    });
  
    return updatedAccess;
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
