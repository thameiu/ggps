import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { ForbiddenException } from '@nestjs/common';
import { CreateMessageDto } from './dto';

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageService],
    }).compile();
    describe('MessageService', () => {
      let service: MessageService;
      let prisma: PrismaService;
      let auth: AuthService;

      beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
          providers: [
            MessageService,
            {
              provide: PrismaService,
              useValue: {
                event: { findUnique: jest.fn() },
                chatroom: { findUnique: jest.fn() },
                message: { create: jest.fn() },
              },
            },
            {
              provide: AuthService,
              useValue: {
                getUserFromToken: jest.fn(),
              },
            },
          ],
        }).compile();

        service = module.get<MessageService>(MessageService);
        prisma = module.get<PrismaService>(PrismaService);
        auth = module.get<AuthService>(AuthService);
      });

      it('should be defined', () => {
        expect(service).toBeDefined();
      });

      describe('create', () => {
        it('should create a message successfully', async () => {
          const dto: CreateMessageDto = { token: 'valid-token', eventId: '1', content: 'Hello' };
          const user = { 
            id: 1, 
            createdAt: new Date(), 
            updateddAt: new Date(), 
            username: 'testuser', 
            email: 'testuser@example.com', 
            firstName: 'Test', 
            lastName: 'User', 
            profilePicture: 'profile-pic-url' 
          };
          const event = { 
            id: 1, 
            number: '1', 
            createdAt: new Date(), 
            updateddAt: new Date(), 
            title: 'Event Title', 
            description: 'Event Description', 
            beginDate: new Date(), 
            endDate: new Date(), 
            street: 'Street', 
            city: 'City', 
            zipCode: 'ZipCode', 
            country: 'Country', 
            game: 'Game',
            latitude: 0,
            longitude: 0,
            category: 'Category'
          };
          const chatroom = { id: 1, createdAt: new Date(), updateddAt: new Date(), eventId: 1 };
          const message = { 
            id: 1, 
            createdAt: new Date(), 
            updateddAt: new Date(), 
            userId: 1, 
            chatroomId: 1, 
            content: 'Hello', 
            pinned: false 
          };

          jest.spyOn(auth, 'getUserFromToken').mockResolvedValue(user);
          jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(event);
          jest.spyOn(prisma.chatroom, 'findUnique').mockResolvedValue(chatroom);
          jest.spyOn(service, 'checkUserAccess').mockResolvedValue({ username: 'testuser', access: { id: 1, createdAt: new Date(), updateddAt: new Date(), userId: 1, chatroomId: 1, role: 'user' } });
          jest.spyOn(prisma.message, 'create').mockResolvedValue(message);

          const result = await service.create(dto);
          expect(result).toEqual({ message, username: user.username });
        });

        it('should throw ForbiddenException if user is not found', async () => {
          const dto: CreateMessageDto = { token: 'invalid-token', eventId: '1', content: 'Hello' };

          jest.spyOn(auth, 'getUserFromToken').mockResolvedValue(null);

          await expect(service.create(dto)).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException if event is not found', async () => {
          const dto: CreateMessageDto = { token: 'valid-token', eventId: '1', content: 'Hello' };
          const user = { 
            id: 1, 
            createdAt: new Date(), 
            updateddAt: new Date(), 
            username: 'testuser', 
            email: 'testuser@example.com', 
            firstName: 'Test', 
            lastName: 'User', 
            profilePicture: 'profile-pic-url' 
          };

          jest.spyOn(auth, 'getUserFromToken').mockResolvedValue(user);
          jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(null);

          await expect(service.create(dto)).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException if chatroom is not found', async () => {
          const dto: CreateMessageDto = { token: 'valid-token', eventId: '1', content: 'Hello' };
          const user = { 
            id: 1, 
            createdAt: new Date(), 
            updateddAt: new Date(), 
            username: 'testuser', 
            email: 'testuser@example.com', 
            firstName: 'Test', 
            lastName: 'User', 
            profilePicture: 'profile-pic-url' 
          };
          const event = { 
            id: 1, 
            number: '1', 
            createdAt: new Date(), 
            updateddAt: new Date(), 
            title: 'Event Title', 
            description: 'Event Description', 
            beginDate: new Date(), 
            endDate: new Date(), 
            street: 'Street', 
            city: 'City', 
            zipCode: 'ZipCode', 
            country: 'Country', 
            game: 'Game',
            latitude: 0,
            longitude: 0,
            category: 'Category'
          };

          jest.spyOn(auth, 'getUserFromToken').mockResolvedValue(user);
          jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(event);
          jest.spyOn(prisma.chatroom, 'findUnique').mockResolvedValue(null);

          await expect(service.create(dto)).rejects.toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException if user does not have access to chatroom', async () => {
          const dto: CreateMessageDto = { token: 'valid-token', eventId: '1', content: 'Hello' };
          const user = { 
            id: 1, 
            createdAt: new Date(), 
            updateddAt: new Date(), 
            username: 'testuser', 
            email: 'testuser@example.com', 
            firstName: 'Test', 
            lastName: 'User', 
            profilePicture: 'profile-pic-url' 
          };
          const event = { 
            id: 1, 
            number: '1', 
            createdAt: new Date(), 
            updateddAt: new Date(), 
            title: 'Event Title', 
            description: 'Event Description', 
            beginDate: new Date(), 
            endDate: new Date(), 
            street: 'Street', 
            city: 'City', 
            zipCode: 'ZipCode', 
            country: 'Country', 
            game: 'Game',
            latitude: 0,
            longitude: 0,
            category: 'Category'
          };
          const chatroom = { id: 1, createdAt: new Date(), updateddAt: new Date(), eventId: 1 };

          jest.spyOn(auth, 'getUserFromToken').mockResolvedValue(user);
          jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(event);
          jest.spyOn(prisma.chatroom, 'findUnique').mockResolvedValue(chatroom);
          jest.spyOn(service, 'checkUserAccess').mockResolvedValue({ username: 'testuser', access: { id: 1, createdAt: new Date(), updateddAt: new Date(), userId: 1, chatroomId: 1, role: 'user' } });

          await expect(service.create(dto)).rejects.toThrow(ForbiddenException);
        });
      });
    })
  });
});