import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitlementEntity } from './infrastructure/persistence/entitlement.entity';

/** Phase 1: entitlements schema only. */
@Module({
  imports: [TypeOrmModule.forFeature([EntitlementEntity])],
})
export class CommerceModule {}
