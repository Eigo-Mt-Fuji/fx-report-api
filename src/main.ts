import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.disable('x-powered-by');
  app.enableCors({
    exposedHeaders: ["X-Total-Count"]
  });
  await app.listen(9000);
}
bootstrap();

/**
 * The X-Total-Count header is missing in the HTTP Response. 
 * The jsonServer Data Provider expects responses for lists of resources to contain this header with the total number of results to build the pagination. 
 * If you are using CORS, did you declare X-Total-Count in the Access-Control-Expose-Headers header?
 */