import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';

// Necesita la base de datos levantada (`pnpm db:up`).
describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('GET /api/health responde el estado del servicio', async () => {
    const respuesta = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(respuesta.body).toMatchObject({ status: expect.any(String) });
  });

  afterEach(async () => {
    await app.close();
  });
});
