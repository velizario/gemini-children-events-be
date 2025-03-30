// src/auth/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
   // You can override handleRequest if you need custom error handling
   // handleRequest(err, user, info, context: ExecutionContext) {
   //   if (err || !user) {
   //     throw err || new UnauthorizedException();
   //   }
   //   return user;
   // }
}