import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppRouter } from './app.router';
import cookieParser from 'cookie-parser';
import { RootConfig } from './config/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(RootConfig);

  app.enableCors({
    origin: [config.frontend_url],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser(config.cookie.secret));

  const trpc = app.get(AppRouter);
  trpc.applyMiddleware(app);

  const port = config.port;
  await app.listen(port, () => console.log(`Server listening on port ${port}`));
}
bootstrap();