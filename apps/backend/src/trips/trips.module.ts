import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from 'src/entities/trip.entity';
import { RoutesModule } from 'src/routes/routes.module';
import { TrpcModule } from 'src/trpc/trpc.module';
import { TripsRouter } from './trips.router';
import { TripsService } from './trips.service';
import { BusesModule } from 'src/buses/buses.module';

@Module({
    imports:[
        TrpcModule,
        TypeOrmModule.forFeature([Trip]),
        RoutesModule,
        BusesModule,
    ],
    providers: [TripsRouter, TripsService],
    exports: [TripsRouter, TripsService],
})
export class TripsModule {}
