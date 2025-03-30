// src/organizers/organizers.module.ts
import { Module } from '@nestjs/common';
import { OrganizersService } from './organizers.service';
import { OrganizersController } from './organizers.controller';
// Import PrismaModule only if it's not marked as @Global()
// import { PrismaModule } from '../../prisma/prisma.module';
// Import UsersModule because OrganizersController uses UsersService currently
// Correction: OrganizersController now uses OrganizersService.
// If OrganizersService needs UsersService (it doesn't currently), import UsersModule.
// import { UsersModule } from '../users/users.module';

@Module({
  // imports: [PrismaModule, UsersModule], // Import if needed by service/controller
  controllers: [OrganizersController],
  providers: [OrganizersService], // Add OrganizersService to providers
  exports: [OrganizersService] // Export if needed by other modules
})
export class OrganizersModule {}
