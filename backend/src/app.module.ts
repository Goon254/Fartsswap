import { Module } from '@nestjs/common';
import { AppLoggingModule } from './app.logging.module';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from './modules/core/core.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ArtifactsModule } from './modules/artifacts/artifacts.module';
import { AudioModule } from './modules/audio/audio.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { CommerceModule } from './modules/commerce/commerce.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    AppConfigModule,
    AppLoggingModule,
    DatabaseModule,
    SharedModule,
    CoreModule,
    IdentityModule,
    ReportsModule,
    ArtifactsModule,
    AudioModule,
    AnalyticsModule,
    AiModule,
    CommerceModule,
    AdminModule,
  ],
})
export class AppModule {}
