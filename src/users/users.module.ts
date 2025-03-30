// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller'; // Import the controller
// Import PrismaModule only if it's not marked as @Global()
// import { PrismaModule } from '../prisma/prisma.module';

@Module({
  // imports: [PrismaModule], // Uncomment if PrismaModule is not global
  controllers: [UsersController], // Add UsersController here
  providers: [UsersService],
  exports: [UsersService], // Keep exporting service if needed by other modules (like AuthModule)
})
export class UsersModule {}
