import { IsBoolean, IsDate, IsEmail, IsISO8601, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator"

export class EventDto {

    @IsNotEmpty()
    @Matches(/^(\+|-)?(?:90(?:(?:\.0{1,30})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,30})?))$/)
    latitude: string;

    @IsNotEmpty()
    @Matches(/^(\+|-)?(?:180(?:\.0{1,30})?|(?:1[0-7][0-9]|[1-9]?[0-9])(?:\.[0-9]{1,30})?)$/)
    longitude: string;

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
        
    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    game?: string;
    
    @IsString()
    token: string;

    @IsBoolean()
    createChatroom: boolean;
}


export class MinMaxCoordinatesDto {

    @IsOptional()
    @IsNotEmpty()
    @Matches(/^(\+|-)?(?:90(?:(?:\.0{1,30})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,30})?))$/)
    latMin: string;

    @IsOptional()
    @IsNotEmpty()
    @Matches(/^(\+|-)?(?:180(?:\.0{1,16})?|(?:1[0-7][0-9]|[1-9]?[0-9])(?:\.[0-9]{1,30})?)$/)
    longMin: string;

    @IsOptional()
    @IsNotEmpty()
    @Matches(/^(\+|-)?(?:90(?:(?:\.0{1,30})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,30})?))$/)
    latMax: string; 

    @IsOptional()
    @IsNotEmpty()
    @Matches(/^(\+|-)?(?:180(?:\.0{1,30})?|(?:1[0-7][0-9]|[1-9]?[0-9])(?:\.[0-9]{1,30})?)$/)
    longMax: string;
    
    @IsString()
    @IsOptional()
    searchWord?: string;

    @IsString()
    @IsOptional()
    category?: string;

}


export class EntryDto {

    @IsNotEmpty()
    token: string;

    @IsNotEmpty()
    eventId: string;

    @IsString()
    @IsNotEmpty()
    status: string;

}