import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './interface/http/health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class CoreModule {}
