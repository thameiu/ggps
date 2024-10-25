import { IsDate, IsEmail, IsNotEmpty, IsString } from "class-validator"

export class EventDto {

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsDate()
    @IsNotEmpty()
    beginDate: string;

    @IsDate()
    @IsNotEmpty()
    endDate: string;
}
