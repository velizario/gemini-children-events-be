// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module'; 
import { UsersModule } from '../users/users.module'; 
import { JwtStrategy } from './jwt.strategy'; // Import JwtStrategy
import { ConfigModule, ConfigService } from '@nestjs/config'; 

@Module({
  imports: [
    PrismaModule, // Make PrismaService available
    PassportModule,
    UsersModule, // Import UsersModule here
    ConfigModule.forRoot(), // Ensure ConfigModule is loaded
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule here too
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION_TIME') },
      }),
      inject: [ConfigService], // Inject ConfigService
    }),
  ],
  providers: [AuthService, JwtStrategy], // Add JwtStrategy
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}