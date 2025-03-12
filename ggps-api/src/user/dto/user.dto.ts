import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class UpdateProfileDto {

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    lastName:string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    firstName:string

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    biography:string

    @IsOptional()
    @IsString()
    street: string;

    @IsOptional()
    @IsString()
    number: string;

    @IsOptional()
    @IsString()
    city: string;

    @IsOptional()
    @IsString()
    zipCode: string;

    @IsOptional()
    @IsString()
    country: string;

}