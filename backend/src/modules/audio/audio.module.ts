import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservabilityModule } from '../../observability/observability.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { IdentityModule } from '../identity/identity.module';
import { AUDIO_UPLOAD_REPOSITORY } from './application/ports/audio-upload.repository';
import { AudioRetentionService } from './application/audio-retention.service';
import { DeleteAudioUploadUseCase } from './application/delete-audio-upload.use-case';
import { GetAudioUploadUseCase } from './application/get-audio-upload.use-case';
import { UploadAudioUseCase } from './application/upload-audio.use-case';
import { AudioUploadEntity } from './infrastructure/persistence/audio-upload.entity';
import { TypeOrmAudioUploadRepository } from './infrastructure/persistence/typeorm-audio-upload.repository';
import { AudioController } from './interface/http/audio.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AudioUploadEntity]),
    IdentityModule,
    AnalyticsModule,
    ObservabilityModule,
  ],
  controllers: [AudioController],
  providers: [
    { provide: AUDIO_UPLOAD_REPOSITORY, useClass: TypeOrmAudioUploadRepository },
    UploadAudioUseCase,
    GetAudioUploadUseCase,
    DeleteAudioUploadUseCase,
    AudioRetentionService,
  ],
  exports: [AUDIO_UPLOAD_REPOSITORY, UploadAudioUseCase, GetAudioUploadUseCase],
})
export class AudioModule {}
