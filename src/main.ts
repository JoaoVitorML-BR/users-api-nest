import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module'; 
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Login')
    .setDescription('Authentication API documentation, users, and auxiliary flows.')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Please provide the JWT access token.',
      },
      'access-token',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
    customSiteTitle: 'API Login Docs',
  });

  await app.listen(process.env.PORT ?? 1952);
}
bootstrap();