import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/user.entity';
import { AppModule } from '../src/app.module';
import { SendTokenFromEmailService } from '../src/common/services/send-email-token.service';

describe('Users Endpoints (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getQueueToken('email'))
      .useValue({
        add: jest.fn().mockResolvedValue({}),
        process: jest.fn(),
      })
      .overrideProvider(SendTokenFromEmailService)
      .useValue({ sendToken: jest.fn().mockResolvedValue(true) })
      .compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('nest-api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const adminUser = {
      username: 'admin',
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'Admin@123',
    };
    await request(app.getHttpServer())
      .post('/nest-api/v1/users')
      .send(adminUser)
      .expect(201);

    await app
      .get(DataSource)
      .getRepository(User)
      .update(
        { email: adminUser.email },
        { isActive: true, emailConfirmed: true },
      );

    // Fazer login e obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/nest-api/v1/auth/login')
      .send({ login: 'admin', password: 'Admin@123' })
      .expect(200);

    adminToken = loginResponse.body.data.accessToken;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('/users (POST) - should create new user', async () => {
    const timestamp = Date.now();
    const createUserDto = {
      username: `user${timestamp.toString().slice(-10)}`,
      name: 'Test User',
      email: `teste${timestamp}@gmail.com`,
      password: 'Teste@123',
    };
    const response = await request(app.getHttpServer())
      .post('/nest-api/v1/users')
      .send(createUserDto)
      .expect(201);
    expect(response.body).toHaveProperty('statusCode', 201);
    expect(response.body).toHaveProperty('status', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.username).toBe(createUserDto.username);
    expect(response.body.data.name).toBe(createUserDto.name);
    expect(response.body.data.email).toBe(createUserDto.email);
  });

  it('/users (GET ALL) - should return all users with valid admin token', async () => {
    const response = await request(app.getHttpServer())
      .get('/nest-api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(response.body).toHaveProperty('statusCode', 200);
    expect(response.body).toHaveProperty('status', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.meta).toEqual({
      page: 1,
      take: 20,
      itemCount: expect.any(Number),
      pageCount: expect.any(Number),
      hasPreviousPage: false,
      hasNextPage: expect.any(Boolean),
    });
  });

  it('/users (GET ALL) - should fail without token', async () => {
    await request(app.getHttpServer()).get('/nest-api/v1/users').expect(401);
  });
});
