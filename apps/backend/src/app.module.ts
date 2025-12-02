import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrpcModule } from './trpc/trpc.module';
import { UsersModule } from './users/users.module';
import { AppRouter } from './app.router';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dotenvLoader, fileLoader, TypedConfigModule } from 'nest-typed-config';
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
import { PassengerDetails } from './entities/passenger-details.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { Payment } from './entities/payment.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { Notification } from './entities/notification.entity';
import { StationsModule } from './stations/stations.module';
import { RoutesModule } from './routes/routes.module';
import { TripsModule } from './trips/trips.module';
import { BusesModule } from './buses/buses.module';
import { BusTypesModule } from './bus-types/bus-types.module';

// TODO: actually set as production mode
// const loader = process.env.NODE_ENV === 'production' ?
//   dotenvLoader({
//     separator: '__',
//     envFilePath: '.env',
//   }) : fileLoader({
//     basename: '.env.development',
//   });

const loader = dotenvLoader({
  separator: '__',
  envFilePath: '.env',
});

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: loader,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [RootConfig],
      useFactory: (config: RootConfig) => ({
        type: 'postgres',
        url: config.database.url,
        entities: [
          User, RefreshToken,
          Bus, BusType, Seat,
          Station, Route, Trip,
          Booking, PassengerDetails,
          Payment, PaymentMethod,
          Notification, NotificationTemplate,
        ],
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
  ],
  controllers: [AppController],
  providers: [AppService, AppRouter, JwtMiddleware],
})
export class AppModule { }
