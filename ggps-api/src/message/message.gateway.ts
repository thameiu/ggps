import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto';

@WebSocketGateway({ 
    cors:true,
}) // Enable CORS for cross-origin requests
export class MessageGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messageService: MessageService) {}

  // Handle when a client connects
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // Handle when a client disconnects
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Handle sending a message in a chatroom
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket
  ) {
    // Save message to the database
    const message = await this.messageService.create(createMessageDto);

    // Broadcast the message to all users in the chatroom
    this.server.to(createMessageDto.eventId).emit('message', message);
    return message;
  }

  // Handle joining a chatroom
  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: { chatroomId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.chatroomId);
    console.log(`Client ${client.id} joined room ${data.chatroomId}`);
    this.server.to(data.chatroomId).emit('userJoined', { userId: client.id });
  }

  // Handle leaving a chatroom
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() data: { chatroomId: string }, @ConnectedSocket() client: Socket) {
    client.leave(data.chatroomId);
    console.log(`Client ${client.id} left room ${data.chatroomId}`);
    this.server.to(data.chatroomId).emit('userLeft', { userId: client.id });
  }

// Handle receiving a message
@SubscribeMessage('messageReceived')
handleMessageReceived(@MessageBody() data: { messageId: string }, @ConnectedSocket() client: Socket) {
    console.log(`Message received: ${data.messageId} by client ${client.id}`);
    this.server.emit('messageReceived', { messageId: data.messageId, userId: client.id });
}
}
