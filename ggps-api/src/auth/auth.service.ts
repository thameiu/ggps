import { Injectable } from "@nestjs/common";

@Injectable({})
export class AuthService{
    login(){
        return { msg:"i have log"}
    }

    signup(){
        return { msg:"i have sign"}

    }
}
