// src/users/users.controller.ts
import { Controller, Get, Body, Patch, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust path if needed
import { GetUser } from '../auth/decorators/get-user.decorator'; // Adjust path if needed
import { User } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users') // Base route for user-related actions
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // NOTE: GET /users/me is likely handled by GET /auth/profile in AuthController
  // If not, you can add it here:
  // @Get('me')
  // getMyProfile(@GetUser() user: User) {
  //   // Return user data (excluding password) - might fetch fresh data
  //   const { password, ...result } = user; // User from token might be slightly stale
  //   return result; // Or call usersService.findOneById(user.id) for fresh data
  // }

  // --- NEW: Update Profile Endpoint ---
  @Patch('me') // Route: PATCH /users/me
  @HttpCode(HttpStatus.OK) // Return 200 OK on success
  updateMyProfile(
    @GetUser() user: User, // Get authenticated user from token
    @Body() updateProfileDto: UpdateProfileDto, // Validate request body
  ) {
    // Pass user ID and DTO to the service method
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  // --- NEW: Change Password Endpoint ---
  @Patch('me/password') // Route: PATCH /users/me/password
  @HttpCode(HttpStatus.OK) // Return 200 OK on success
  changeMyPassword(
    @GetUser() user: User, // Get authenticated user
    @Body() changePasswordDto: ChangePasswordDto, // Validate request body
  ) {
    return this.usersService.changePassword(user.id, changePasswordDto);
  }
}

