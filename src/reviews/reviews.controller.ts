// src/reviews/reviews.controller.ts
import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust path
import { GetUser } from '../auth/decorators/get-user.decorator'; // Adjust path
import { User } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews') // Base route /reviews
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}

    /**
     * Creates a new review. Requires authentication.
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED) // Return 201 Created on success
    addReview(
        @GetUser() user: User, // Get the logged-in user (reviewer)
        @Body() createReviewDto: CreateReviewDto // Validate request body
    ) {
        // Service method handles authorization (e.g., ensuring user is PARENT)
        return this.reviewsService.addReview(user, createReviewDto);
    }

    // Add GET endpoints later to fetch reviews (e.g., by organizerId or eventId)
}
