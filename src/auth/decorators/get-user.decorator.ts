// src/auth/decorators/get-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User as UserModel } from '@prisma/client'; // Use Prisma's User type

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserModel => { // Specify return type
    const request = ctx.switchToHttp().getRequest();
    // The user object is attached to the request by JwtStrategy.validate()
    return request.user;
  },
);