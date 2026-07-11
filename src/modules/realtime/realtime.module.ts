import { Module } from '@nestjs/common';
import { RealTimeGateWay } from './realtime.gateway';

@Module({ providers: [RealTimeGateWay] })
export class RealTimeModule {}
