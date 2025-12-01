import { Module } from '@nestjs/common';
import { StationsService } from './stations.service';
import { TrpcModule } from 'src/trpc/trpc.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Station } from 'src/entities/station.entity';
import { StationsRouter } from './stations.router';

@Module({
  imports: [
    TrpcModule,
    TypeOrmModule.forFeature([Station]),
  ],
  providers: [StationsService, StationsRouter],
  exports: [StationsService, StationsRouter],
})
export class StationsModule { }
