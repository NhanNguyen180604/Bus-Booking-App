import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from 'src/entities/route.entity';
import { TrpcModule } from 'src/trpc/trpc.module';
import { RoutesRouter } from './routes.router';
import { RoutesService } from './routes.service';
import { StationsModule } from 'src/stations/stations.module';

@Module({
    imports: [
        TrpcModule,
        TypeOrmModule.forFeature([Route]),
        StationsModule,
    ],
    providers: [RoutesRouter, RoutesService],
    exports: [RoutesRouter],
})
export class RoutesModule {}
