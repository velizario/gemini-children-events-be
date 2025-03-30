// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsModule } from './events/events.module';
import { MailerModule } from '@nestjs-modules/mailer'; // Import MailerModule
import { join } from 'path'; // For template path
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'; // Example adapter

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // --- Mailer Module Configuration ---
    MailerModule.forRootAsync({
       imports: [ConfigModule], 
       useFactory: async (config: ConfigService) => ({
         transport: {
           host: config.get<string>('MAIL_HOST', 'smtp.example.com'), // Default host
           port: config.get<number>('MAIL_PORT', 587), // Default port
           secure: config.get<string>('MAIL_SECURE', 'false') === 'true', // Use STARTTLS if false/port 587, true for 465
           auth: {
             user: config.get<string>('MAIL_USER'),
             pass: config.get<string>('MAIL_PASSWORD'),
           },
           // Use Ethereal for testing if no real SMTP server:
           // host: 'smtp.ethereal.email',
           // port: 587,
           // auth: { user: 'ethereal-user@ethereal.email', pass: 'ethereal-password' }
         },
         defaults: {
           from: `"${config.get<string>('MAIL_FROM_NAME', 'KidzEvents')}" <${config.get<string>('MAIL_FROM_ADDRESS', 'noreply@kidzevents.com')}>`,
         },
         template: { // Optional: For using email templates
           dir: join(__dirname, '..', 'templates'), // Path relative to 'dist' folder after build
           adapter: new HandlebarsAdapter(),
           options: {
             strict: true,
           },
         },
       }),
       inject: [ConfigService],
     }),
    // --- Other Modules ---
    PrismaModule,
    AuthModule,
    UsersModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}