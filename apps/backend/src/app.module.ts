import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcModule } from './trpc/trpc.module';
import { UsersModule } from './users/users.module';
import { AppRouter } from './app.router';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dotenvLoader, TypedConfigModule } from 'nest-typed-config';
import { RootConfig } from './config/config';
import { CustomJwtModule } from './jwt/custom-jwt.module';
import { JwtMiddleware } from './middlewares/jwt.middleware';
import { User } from './entities/users.entity';
import { TokenModule } from './token/token.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { Oauth2Module } from './oauth2/oauth2.module';
import { Station } from './entities/station.entity';
import { Route } from './entities/route.entity';
import { Bus } from './entities/bus.entity';
import { Trip } from './entities/trip.entity';
import { Seat } from './entities/seat.entity';
import { BusType } from './entities/bus-type.entity';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { Notification } from './entities/notification.entity';
import { Review } from './entities/review.entity';
import { StationsModule } from './stations/stations.module';
import { RoutesModule } from './routes/routes.module';
import { TripsModule } from './trips/trips.module';
import { BusesModule } from './buses/buses.module';
import { BusTypesModule } from './bus-types/bus-types.module';
import { BookingModule } from './booking/booking.module';
import { MyMailerModule } from './my-mailer/my-mailer.module';
import { StripeModule } from './stripe/stripe.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { RawBodyMiddleware } from './middlewares/raw-body.middleware';
import { ReportsModule } from './reports/reports.module';
import { PaymentsModule } from './payments/payments.module';
import { TasksModule } from './tasks/tasks.module';
import { ReviewModule } from './reviews/reviews.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ResetPasswordToken } from './entities/reset-password-token.entity';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { DatabaseInitService } from './database/database-init.service';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: dotenvLoader({
        separator: '__',
        envFilePath: '.env',
      }),
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [RootConfig],
      useFactory: (config: RootConfig) => ({
        type: 'postgres',
        url: config.database.url,
        entities: [
          User, RefreshToken, ResetPasswordToken,
          Bus, BusType, Seat,
          Station, Route, Trip,
          Booking,
          Payment,
          Notification,
          Review,
        ],
        // TODO: set this as false when deployed
        synchronize: true,
      }),
    }),
    CustomJwtModule,
    TrpcModule,
    UsersModule,
    TokenModule,
    Oauth2Module,
    StationsModule,
    RoutesModule,
    TripsModule,
    BusesModule,
    BusTypesModule,
    BookingModule,
    MyMailerModule,
    StripeModule,
    WebhooksModule,
    ReportsModule,
    PaymentsModule,
    TasksModule,
    ReviewModule,
    ScheduleModule.forRoot(),
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppRouter, JwtMiddleware, DatabaseInitService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RawBodyMiddleware)
      .forRoutes({
        path: 'webhooks/stripe',
        method: RequestMethod.POST,
      })
  }
}
