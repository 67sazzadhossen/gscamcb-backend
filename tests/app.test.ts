import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import app from '../src/app';
import catchAsync from '../src/app/utils/catchAsync';
import { validateRequest } from '../src/app/middlewares/validateRequest';
import { globalErrorHandler } from '../src/app/middlewares/globalErrorHandler';
import { AppError } from '../src/app/errors/AppError';
import { Prisma } from '../prisma/generated/prisma/client';

test('health uses the shared response format', async () => {
  const response = await request(app).get('/api/v1/health').expect(200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.service, 'gscamcb-backend');
  assert.equal(response.body.data.statusCode, undefined);
});
test('unknown routes use the global error response', async () => {
  const response = await request(app).get('/api/v1/missing').expect(404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, 'API route not found');
});
test('CORS allows the frontend with credentials', async () => {
  const response = await request(app)
    .get('/api/v1/health')
    .set('Origin', 'http://localhost:3000')
    .expect(200);
  assert.equal(
    response.headers['access-control-allow-origin'],
    'http://localhost:3000',
  );
  assert.equal(response.headers['access-control-allow-credentials'], 'true');
});
test('malformed JSON is a client error', async () => {
  const response = await request(app)
    .post('/api/v1/missing')
    .set('Content-Type', 'application/json')
    .send('{')
    .expect(400);
  assert.equal(response.body.message, 'Invalid JSON body');
});
test('validation transforms the body and reports field errors', async () => {
  const fixture = express();
  fixture.use(express.json());
  fixture.post(
    '/',
    validateRequest(z.object({ name: z.string().trim().min(1) })),
    (req, res) => {
      res.json(req.body);
    },
  );
  fixture.use(globalErrorHandler);
  const invalid = await request(fixture)
    .post('/')
    .send({ name: '' })
    .expect(400);
  assert.equal(invalid.body.errorSources[0].path, 'name');
  const valid = await request(fixture)
    .post('/')
    .send({ name: ' School ' })
    .expect(200);
  assert.equal(valid.body.name, 'School');
});
test('catchAsync forwards rejections to the global handler', async () => {
  const fixture = express();
  fixture.get(
    '/',
    catchAsync(async () => {
      throw new AppError(403, 'Forbidden');
    }),
  );
  fixture.use(globalErrorHandler);
  const response = await request(fixture).get('/').expect(403);
  assert.equal(response.body.message, 'Forbidden');
});
test('Prisma unique conflicts and missing records have useful HTTP statuses', async () => {
  for (const [code, status] of [
    ['P2002', 409],
    ['P2025', 404],
    ['P2023', 400],
  ] as const) {
    const fixture = express();
    fixture.get(
      '/',
      catchAsync(async () => {
        throw new Prisma.PrismaClientKnownRequestError('Database error', {
          code,
          clientVersion: '6.19.0',
        });
      }),
    );
    fixture.use(globalErrorHandler);
    const response = await request(fixture).get('/').expect(status);
    assert.equal(response.body.success, false);
  }
});
test('unexpected errors hide internal messages in production', async () => {
  const { default: config } = await import('../src/app/config');
  const previous = config.node_env;
  const originalError = console.error;
  config.node_env = 'production';
  console.error = () => undefined;
  try {
    const fixture = express();
    fixture.get(
      '/',
      catchAsync(async () => {
        throw new Error('private database detail');
      }),
    );
    fixture.use(globalErrorHandler);
    const response = await request(fixture).get('/').expect(500);
    assert.equal(response.body.message, 'Something went wrong');
    assert.equal(response.body.stack, null);
    assert.equal(
      JSON.stringify(response.body).includes('private database detail'),
      false,
    );
  } finally {
    config.node_env = previous;
    console.error = originalError;
  }
});
