import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { EventController } from './event.controller';
  import { DeleteDto, EntryDto, EventDto, RemoveEntryDto, UpdateEntryStatusDto } from './dto';
  import { ForbiddenException } from '@nestjs/common';
  import { MessageController } from 'src/message/message.controller';
  
  const rateLimitStore = new Map<string, { lastMessageTime: number; messageCount: number }>();
  const TIME_WINDOW = 1; // 1 second for simplicity in rate limiting
  const MAX_MESSAGES = 1; // Limit to 1 message per TIME_WINDOW
  
  @WebSocketGateway({
    cors: {
      origin: 'http://localhost:3000', 
    },
  })
  export class EventGateway {
    @WebSocketServer()
    server: Server;
  
    constructor(private readonly eventController: EventController, private readonly messageController: MessageController) {}

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@MessageBody() eventId: string, @ConnectedSocket() client: Socket) {
      try {
        console.log("joinRoom event received with eventId:", eventId);
        client.join(eventId);
        console.log("Client joined room:", eventId);
        this.server.to(eventId).emit('joinedChatroom','Joined Chatroom');

      } catch (error) {
        console.error("Error handling joinRoom event:", error);
      }
    }

    @SubscribeMessage('participantsUpdate')
    async handleParticipantsUpdate(
      @MessageBody() eventId: string,
      @ConnectedSocket() client: Socket,
    ) {
      try {
        // if (!this.checkRateLimit(client.id)) {
        //   client.emit('error', 'Rate limit exceeded');
        //   return;
        // }
  

        console.log('here :',eventId);
        const updatedParticipants = await this.eventController.getEntriesByEventId(parseInt(eventId));
        console.log(updatedParticipants);
        this.server.to(eventId).emit('participantsUpdateReceived', updatedParticipants);
        // console.log('here2')
        // client.emit("participantsUpdateReceived", updatedParticipants);
        return { status: 'success', data: updatedParticipants };
      } catch (error) {
        client.emit('error', error.message || 'An error occurred');
      }
    }
  


    @SubscribeMessage('deleteEvent')
    async handleDeleteEvent(
      @MessageBody() eventId: string,
      @ConnectedSocket() client: Socket,
    ) {
      try {

        this.server.to(eventId).emit('eventDeleted','Event deletion received');
        return { status: 'success' };
      } catch (error) {
        client.emit('error', error.message || 'An error occurred');
      }
    }

    checkRateLimit(clientId: string) {
      const currentTime = Date.now();
      const rateLimitData = rateLimitStore.get(clientId) || { lastMessageTime: 0, messageCount: 0 };
  
      if (currentTime - rateLimitData.lastMessageTime < TIME_WINDOW) {
        if (rateLimitData.messageCount >= MAX_MESSAGES) {
          return false;
        }
        rateLimitData.messageCount += 1;
      } else {
        rateLimitData.lastMessageTime = currentTime;
        rateLimitData.messageCount = 1;
      }
  
      rateLimitStore.set(clientId, rateLimitData);
      return true;
    }
  }
  