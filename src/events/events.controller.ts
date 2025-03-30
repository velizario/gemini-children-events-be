// src/events/events.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ParseIntPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// Adjust DTO paths if they differ from this structure
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventDto } from './dto/filter-event.dto';
import { GetUser } from '../auth/decorators/get-user.decorator'; // Custom decorator to get user from request
import { User } from '@prisma/client';

@Controller('events') // Base path for event-related actions
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  // --- Existing Event CRUD Endpoints ---
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createEventDto: CreateEventDto, @GetUser() user: User) {
    // Ensure DTO path is correct in your project
    return this.eventsService.create(createEventDto, user);
  }

  @Get()
  findAll(@Query() filterDto: FilterEventDto) {
    // Ensure DTO path is correct in your project
    return this.eventsService.findAll(filterDto);
  }

  // Endpoint for organizers to get their own events
  @UseGuards(JwtAuthGuard)
  @Get('/my-events') 
  findMyEvents(@GetUser() user: User) {
    return this.eventsService.findMyEvents(user.id);
  }

  // Endpoint for parents to get their registrations
  @UseGuards(JwtAuthGuard) 
  @Get('/my-registrations') 
  findMyRegistrations(@GetUser() user: User) {
    return this.eventsService.findMyRegistrations(user.id);
  }


  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }



  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto, // Ensure DTO path is correct
    @GetUser() user: User
  ) {
    return this.eventsService.update(id, updateEventDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.eventsService.remove(id, user);
  }

  // --- Existing Registration/Participant Endpoints ---
  @UseGuards(JwtAuthGuard)
  @Post(':id/register') // Route: POST /events/:id/register
  register(
    @Param('id', ParseIntPipe) eventId: number,
    @GetUser() user: User,
    // @Body() registrationDataDto: CreateRegistrationDto // Optional DTO
  ) {
    // Pass only necessary arguments if no extra data needed
    return this.eventsService.registerForEvent(eventId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/participants') // Route: GET /events/:id/participants
  getParticipants(
    @Param('id', ParseIntPipe) eventId: number,
    @GetUser() user: User
  ) {
    return this.eventsService.getEventParticipants(eventId, user);
  }



}
