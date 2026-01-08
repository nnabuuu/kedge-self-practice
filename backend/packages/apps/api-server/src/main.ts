// Load .env file before any other imports
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import assert from 'assert';
import express , { Response, json, urlencoded } from 'express';
import { patchNestJsSwagger } from 'nestjs-zod';
import { AppModule } from './app/app.module';
import { env } from './env';
import { Logger, VersioningType } from '@nestjs/common';

const clientJsonPayloadLimit = '10mb';

/**
 * This is the hack for colon in request path, which conforms to google api convention.
 * @param document the open api object
 */
function amendActionPath(document: OpenAPIObject) {
  const paths = Object.keys(document.paths);
  for (const p of paths) {
    if (p.indexOf('[:]') < 0) continue;
    const fixedPath = p.split('[:]').join(':');
    const pathDocument = document.paths[p];
    assert(pathDocument, `path ${p} not found`);
    document.paths[fixedPath] = pathDocument;
    delete document.paths[p];
  }
}

function maskApiKey(key: string | undefined): string {
  if (!key) return '(not set)';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

async function bootstrap() {
  const logger = new Logger('bootstrap');

  // Log environment configuration before starting the app
  logger.log('=== Environment Configuration ===');
  logger.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`API_PORT: ${process.env.API_PORT || process.env.PORT || 8716}`);
  logger.log(`JWT_SECRET: ${maskApiKey(process.env.JWT_SECRET)}`);
  logger.log(`NODE_DATABASE_URL: ${process.env.NODE_DATABASE_URL ? 'configured' : '(not set)'}`);
  logger.log(`REDIS_HOST: ${process.env.REDIS_HOST || 'localhost'}`);
  logger.log(`LLM_BASE_URL: ${process.env.LLM_BASE_URL || '(using default)'}`);
  logger.log(`LLM_API_KEY: ${maskApiKey(process.env.LLM_API_KEY)}`);
  logger.log(`LLM_MODEL_QUIZ_PARSER: ${process.env.LLM_MODEL_QUIZ_PARSER || 'gpt-4o (default)'}`);
  logger.log('=================================');

  const app = await NestFactory.create(AppModule, {});

  // Enable API versioning with /v1 prefix as default
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
    origin: true, // Allow all origins
  });
  app.use(express.text());
  app.use(json({ limit: clientJsonPayloadLimit }));
  app.use(urlencoded({ limit: clientJsonPayloadLimit, extended: true }));

  const swaggerBuilder = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('ALEX B20 API')
    .setDescription('Alex B20 API service')
    .setVersion('0.0.1')
    .build();
  patchNestJsSwagger();
  const document = SwaggerModule.createDocument(app, swaggerBuilder);
  amendActionPath(document);
  SwaggerModule.setup('swagger-ui', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  app.getHttpAdapter().get('/swagger-api.json', (_, res: Response) => {
    res.json(document);
  });
  process
    .on('unhandledRejection', reason => {
      const message =
        reason instanceof Error
          ? `${reason.stack ?? reason}`
          : JSON.stringify(reason);
      logger.error(`unhandledRejection: ${message}`);
      process.exit(1);
    })
    .on('uncaughtException', (err, origin) => {
      logger.error(`${origin} ${err.name} ${err.stack}`);
      process.exit(1);
    });

  const port = process.env.PORT || env.API_PORT;
  await app.listen(port, () => {
    logger.log(`Kedge API server started at port ${port}`);
  });
}
bootstrap().catch(e => {
  console.error(e);
  process.exit(1);
});
