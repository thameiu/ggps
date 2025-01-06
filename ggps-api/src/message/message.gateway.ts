import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageController } from './message.controller';
import { CreateMessageDto, PinMessageDto } from './dto';
import { ForbiddenException } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000', 
  },
})
export class MessageGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messageController: MessageController) {}

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const messageData = await this.messageController.createMessage(createMessageDto);

      this.server.to(createMessageDto.eventId).emit('receiveMessage', messageData);
      console.log('messageData', messageData);
      return { status: 'success', data: messageData };
    } catch (error) {
      client.emit('error', error.message || 'An error occurred');
    }
  }

  @SubscribeMessage('joinChatroom')
  async handleJoinChatroom(
    @MessageBody('eventId') eventId: string,
    @MessageBody('token') token: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const access = await this.messageController.getUserAccess(token, eventId);

      if (!access) {
        throw new ForbiddenException('Access denied to chatroom');
      }

      client.join(eventId);
      client.emit('joinedChatroom', { eventId });

      return { status: 'success', message: `Joined chatroom ${eventId}` };
    } catch (error) {
      client.emit('error', error.message || 'An error occurred');
    }
  }

  @SubscribeMessage('leaveChatroom')
  async handleLeaveChatroom(
    @MessageBody('eventId') eventId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(eventId);
    client.emit('leftChatroom', { eventId });
  }

  @SubscribeMessage('pinMessage')
  async handlePinMessage(
    @MessageBody() pinMessageDto: PinMessageDto,
    @ConnectedSocket() client: Socket,
  ) { 
    try {
      
      const updatedMessage = await this.messageController.pinMessage(pinMessageDto);
      console.log('updatedMessage', updatedMessage);
      
      this.server.to(pinMessageDto.eventId).emit('messagePinned', updatedMessage);

      return { status: 'success', data: updatedMessage };
    } catch (error) {
      client.emit('error', error.message || 'An error occurred');
    }
  }
}
