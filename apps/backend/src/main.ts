import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppRouter } from './app.router';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000'],
  });

  const trpc = app.get(AppRouter);
  trpc.applyMiddleware(app);

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
