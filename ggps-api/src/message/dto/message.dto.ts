import { IsInt, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMessageDto {

    @IsNotEmpty()
    @IsString()
    token: string;

    @IsNotEmpty()
    @IsInt()
    chatroomId: number;

    @IsNotEmpty()
    @IsString()
    @MinLength(1)
    @MaxLength(150)
    content: string;

}

export class CreateChatroomDto {

    @IsNotEmpty()
    eventId: string;

    @IsString()
    @MinLength(1)
    @MaxLength(150)
    firstMessageContent: string;
}

export class PinMessageDto {

    @IsNotEmpty()
    @IsInt()
    messageId: number;

}