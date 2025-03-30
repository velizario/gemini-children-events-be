// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client'; // Import Role enum
import { LoginDto } from './dto/login.dto'; // Create this DTO
import { RegisterDto }  from './dto/register.dto'; // Create this DTO


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService, // Inject PrismaService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result; // Return user object without password
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { // Send back some user info
         id: user.id,
         email: user.email,
         firstName: user.firstName,
         lastName: user.lastName,
         role: user.role,
      }
    };
  }

  async register(registerDto: RegisterDto) {
     const existingUser = await this.usersService.findOneByEmail(registerDto.email);
     if (existingUser) {
       throw new BadRequestException('Email already exists');
     }

     const hashedPassword = await bcrypt.hash(registerDto.password, 10); // Salt rounds: 10

     const newUser = await this.prisma.user.create({
       data: {
         email: registerDto.email,
         password: hashedPassword,
         firstName: registerDto.firstName,
         lastName: registerDto.lastName,
         role: registerDto.role ?? Role.PARENT, // Default to PARENT if not provided
       },
     });

     // Optionally create OrganizerProfile if role is ORGANIZER
     if (newUser.role === Role.ORGANIZER) {
        // You might want separate DTO fields for organizer info
        await this.prisma.organizerProfile.create({
           data: {
              userId: newUser.id,
              orgName: `${newUser.firstName}'s Organization`, // Default or get from DTO
              // ... other default profile fields
           }
        })
     }

     // Exclude password from the returned user object
     const { password, ...result } = newUser;

     // Optionally log the user in immediately after registration
     // const payload = { email: result.email, sub: result.id, role: result.role };
     // return {
     //   access_token: this.jwtService.sign(payload),
     //   user: result
     // };

     return { message: 'Registration successful', user: result }; // Or just return the user/success message
   }
}