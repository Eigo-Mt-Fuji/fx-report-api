import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

// for aws serverless
import serverlessExpress from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';

import { AppModule } from './app.module';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.disable('x-powered-by');

  // for react-admin
  /**
   * The X-Total-Count header is missing in the HTTP Response. 
   * The jsonServer Data Provider expects responses for lists of resources to contain this header with the total number of results to build the pagination. 
   * If you are using CORS, did you declare X-Total-Count in the Access-Control-Expose-Headers header?
   */
  app.enableCors({
    exposedHeaders: ["X-Total-Count"]
  });
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
