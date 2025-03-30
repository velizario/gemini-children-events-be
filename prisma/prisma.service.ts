// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  // Optional: Graceful shutdown hook
  async enableShutdownHooks(app: INestApplication) {
     process.on('beforeExit', async () => {
        await app.close();
     });
  }
}