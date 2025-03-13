import { IsInt, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMessageDto {

    @IsNotEmpty()
    @IsString()
    token: string;

    @IsNotEmpty()
    @IsString()
    eventId: string;

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
    @MaxLength(150)
    firstMessageContent?: string;
}

export class PinMessageDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsNotEmpty()
    @IsInt()
    messageId: number;

    @IsNotEmpty()
    eventId: string;
}

export class UpdateAccessDto {

    @IsNotEmpty()
    @IsString()
    token: string;

    @IsNotEmpty()
    @IsString()
    eventId: string;

    @IsNotEmpty()
    @IsString()
    role: string;

    @IsNotEmpty()
    @IsString()
    username: string;
}