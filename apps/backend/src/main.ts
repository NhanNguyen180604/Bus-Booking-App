import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppRouter } from './app.router';
import cookieParser from 'cookie-parser';
import { RootConfig } from './config/config';
// import session from 'express-session';
// import connectPgSimple from 'connect-pg-simple';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(RootConfig);

  app.enableCors({
    origin: [config.frontend_url],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser(config.cookie.secret));
  // app.use(session({
  //   secret: config.session.secret,
  //   resave: false,
  //   saveUninitialized: false,
  //   store: new (connectPgSimple(session))({
  //     conString: config.database.session_db_url,
  //     createTableIfMissing: true,
  //     ttl: 60 * 60, // 1 hour
  //   }),
  // }));

  const trpc = app.get(AppRouter);
  trpc.applyMiddleware(app);

  const port = config.port;
  await app.listen(port, () => console.log(`Server listening on port ${port}`));
}
bootstrap();