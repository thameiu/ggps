import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto, CreateChatroomDto } from './dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('chat')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  
  @Post('message')
  @UseGuards(AuthGuard)
  createMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.create(createMessageDto);
  }

  @Post('room')
  @UseGuards(AuthGuard)
  createChatroom(@Body() createChatroomDto: CreateChatroomDto) {
    return this.messageService.createChatroom(createChatroomDto);
  }

  @Get(':eventId/messages')
  @UseGuards(AuthGuard)
  getMessagesByChatroom(@Param('eventId') eventId: string) {
    return this.messageService.getMessagesByChatroom(eventId);
  }

  // @Get()
  // findAll() {
  //   return this.messageService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.messageService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
  //   return this.messageService.update(+id, updateMessageDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.messageService.remove(+id);
  // }
}
