import { IsDate, IsEmail, IsISO8601, IsNotEmpty, IsString } from "class-validator"

export class EventDto {

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsISO8601()
    @IsNotEmpty()
    beginDate: string;

    @IsISO8601()
    @IsNotEmpty()
    endDate: string;

    @IsString()
    @IsNotEmpty()
    street: string;

    @IsString()
    @IsNotEmpty()
    number: string;
    
    @IsString()
    @IsNotEmpty()
    city: string;
    
    @IsString()
    @IsNotEmpty()
    zipCode: string;
    
    @IsString()
    @IsNotEmpty()
    country: string;
    
}
