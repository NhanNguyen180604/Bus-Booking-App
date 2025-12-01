import { Module } from '@nestjs/common';
import { BusTypesService } from './bus-types.service';
import { TrpcModule } from '../trpc/trpc.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusType } from '../entities/bus-type.entity';
import { BusTypesRouter } from './bus-types.router';

@Module({
  imports: [
    TrpcModule,
    TypeOrmModule.forFeature([BusType]),
  ],
  providers: [BusTypesService, BusTypesRouter],
  exports: [BusTypesService, BusTypesRouter],
})
export class BusTypesModule { }
