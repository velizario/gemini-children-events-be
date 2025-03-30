// src/reviews/reviews.module.ts
import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
// Import PrismaModule only if it's not marked as @Global()
// import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  // imports: [PrismaModule], // Uncomment if PrismaModule is not global
  controllers: [ReviewsController],
  providers: [ReviewsService],
  // Export service if needed elsewhere
  // exports: [ReviewsService],
})
export class ReviewsModule {}
