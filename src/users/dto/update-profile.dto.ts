// src/users/dto/update-profile.dto.ts
import { IsString, IsNotEmpty, IsOptional, MinLength, IsEmail } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @IsNotEmpty({ message: 'First name cannot be empty' })
    @MinLength(1)
    @IsOptional() // Make fields optional so user can update only one if needed
    firstName?: string;

    @IsString()
    @IsNotEmpty({ message: 'Last name cannot be empty' })
    @MinLength(1)
    @IsOptional()
    lastName?: string;

    //TODO: requires careful handling (e.g., verification)
    @IsEmail()
    email: string;
}
