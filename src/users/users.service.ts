// src/users/users.service.ts
import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Adjust path if needed
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findOneById(id: number): Promise<User | null> {
     const user = await this.prisma.user.findUnique({ where: { id } });
     if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
     }
     return user;
   }

  // --- NEW: Update User Profile ---
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<Omit<User, 'password'>> {
    try {
        // Ensure at least one field is being updated
        if (!updateProfileDto.firstName && !updateProfileDto.lastName && !updateProfileDto.email) {
             throw new BadRequestException('No profile data provided for update.');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                // Only include fields if they are provided in the DTO
                ...(updateProfileDto.firstName && { firstName: updateProfileDto.firstName }),
                ...(updateProfileDto.lastName && { lastName: updateProfileDto.lastName }),
                ...(updateProfileDto.email && { email: updateProfileDto.email }),
            },
        });

        // Exclude password from the returned object
        const { password, ...result } = updatedUser;
        return result;

    } catch (error) {
         // Handle potential errors, e.g., Prisma errors
         console.error(`Error updating profile for user ${userId}:`, error);
         // Rethrow or handle specific errors
         if (error instanceof BadRequestException) throw error;
         throw new BadRequestException('Could not update profile.');
    }
  }

  // --- NEW: Change User Password ---
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
     // 1. Get the user, including their current password hash
     const user = await this.prisma.user.findUnique({
         where: { id: userId },
     });
     if (!user) {
         // This shouldn't happen if called from an authenticated route, but check anyway
         throw new NotFoundException('User not found.');
     }

     // 2. Compare the provided current password with the stored hash
     const isPasswordMatching = await bcrypt.compare(
         changePasswordDto.currentPassword,
         user.password,
     );

     if (!isPasswordMatching) {
        throw new BadRequestException('Incorrect current password.');
     }

     // 3. Check if new password is the same as the old one
     if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
         throw new BadRequestException('New password cannot be the same as the current password.');
     }

     // 4. Hash the new password
     const newHashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10); // Use appropriate salt rounds

     // 5. Update the user's password in the database
     try {
         await this.prisma.user.update({
             where: { id: userId },
             data: { password: newHashedPassword },
         });
         return { message: 'Password changed successfully.' };
     } catch (error) {
         console.error(`Error changing password for user ${userId}:`, error);
         throw new BadRequestException('Could not change password.');
     }
  }

  // Add createUser method here if it doesn't exist from registration setup
}
