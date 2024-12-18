import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.headers['authorization'];

        if (!token) {
            return false;
        }

        const isValid = await this.authService.verifyToken(token);
        if (!isValid) {
            return false;
        }

        return true;
    }
}
