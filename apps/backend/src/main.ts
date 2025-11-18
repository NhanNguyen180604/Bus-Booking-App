import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { testImport } from '@lib/test-import';

async function bootstrap() {
  console.log(testImport);
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
