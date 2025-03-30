// src/events/events.module.ts
import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
// Import PrismaModule if not global

@Module({
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}