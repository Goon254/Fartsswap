import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ANONYMOUS_SESSION_REPOSITORY } from './application/ports/anonymous-session.repository';
import { CreateAnonymousSessionUseCase } from './application/create-anonymous-session.use-case';
import { ResolveAnonymousSessionUseCase } from './application/resolve-anonymous-session.use-case';
import { AnonymousSessionEntity } from './infrastructure/persistence/anonymous-session.entity';
import { TypeOrmAnonymousSessionRepository } from './infrastructure/persistence/typeorm-anonymous-session.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AnonymousSessionEntity])],
  providers: [
    { provide: ANONYMOUS_SESSION_REPOSITORY, useClass: TypeOrmAnonymousSessionRepository },
    CreateAnonymousSessionUseCase,
    ResolveAnonymousSessionUseCase,
  ],
  exports: [ResolveAnonymousSessionUseCase, CreateAnonymousSessionUseCase],
})
export class IdentityModule {}
