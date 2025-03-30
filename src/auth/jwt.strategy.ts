// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service'; // Corrected path
import { ConfigService } from '@nestjs/config'; // Import ConfigService
import { UsersService } from '../users/users.service'; // Corrected path

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService, // Inject ConfigService
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    
  }

  async validate(payload: any) {
    // Passport first verifies the JWT's signature and expiration based on the secretOrKey
    // The validate function receives the decoded JWT payload
    const user = await this.usersService.findOneById(payload.sub); // 'sub' usually holds the user ID
    if (!user) {
         throw new UnauthorizedException();
    }
    // You can attach user object or just parts of it to the request object
    // Exclude password from the user object returned
    const { password, ...result } = user;
    return result; // This will be attached to request.user
  }
}