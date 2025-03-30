// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Import ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS - Configure origins as needed for security
  app.enableCors({
    origin: 'http://localhost:5173', // Your frontend URL (Vite default)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable ValidationPipe globally to use class-validator DTOs
  app.useGlobalPipes(new ValidationPipe({
     whitelist: true, // Strip properties that do not have any decorators
     transform: true, // Automatically transform payloads to DTO instances
  }));


  await app.listen(3000); // Backend runs on port 3000
}
bootstrap();