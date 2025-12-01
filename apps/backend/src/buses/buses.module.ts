import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from '../entities/bus.entity';
import { Seat } from '../entities/seat.entity';
import { TrpcModule } from '../trpc/trpc.module';
import { BusesService } from './buses.service';
import { BusesRouter } from './buses.router';
import { UsersModule } from 'src/users/users.module';
import { BusTypesModule } from 'src/bus-types/bus-types.module';

@Module({
    imports: [
        TrpcModule,
        TypeOrmModule.forFeature([Bus, Seat]),
        UsersModule,
        BusTypesModule,
    ],
    providers: [BusesService, BusesRouter],
    exports: [BusesService, BusesRouter],
})
export class BusesModule { }
