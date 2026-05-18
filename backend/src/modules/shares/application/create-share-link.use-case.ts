import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ShareLink } from '../../../shared/domain/models';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import { ShareEventEntity } from '../infrastructure/persistence/share-event.entity';
import { ShareLinkEntity } from '../infrastructure/persistence/share-link.entity';

export interface CreateShareLinkCommand {
  reportId: string;
  sessionId?: string;
  kind?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class CreateShareLinkUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @InjectRepository(ShareLinkEntity) private readonly links: Repository<ShareLinkEntity>,
    @InjectRepository(ShareEventEntity) private readonly events: Repository<ShareEventEntity>,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(command: CreateShareLinkCommand): Promise<ShareLink> {
    const report = await this.reports.findReportById(command.reportId);
    if (!report) {
      throw new NotFoundException(`Report ${command.reportId} not found`);
    }
    if (report.sessionId && command.sessionId && report.sessionId !== command.sessionId) {
      throw new ForbiddenException('Report does not belong to this session');
    }

    const now = this.clock.now();
    const id = this.ids.generate();
    const token = randomBytes(24).toString('base64url').slice(0, 48);

    const linkEntity = new ShareLinkEntity();
    linkEntity.id = id;
    linkEntity.reportId = command.reportId;
    linkEntity.sessionId = command.sessionId;
    linkEntity.token = token;
    linkEntity.createdAt = now;

    const eventEntity = new ShareEventEntity();
    eventEntity.id = this.ids.generate();
    eventEntity.sessionId = command.sessionId;
    eventEntity.reportId = command.reportId;
    eventEntity.shareLinkId = id;
    eventEntity.kind = command.kind ?? 'link_created';
    eventEntity.payload = command.metadata;
    eventEntity.createdAt = now;

    await this.links.save(linkEntity);
    await this.events.save(eventEntity);

    return {
      id,
      reportId: command.reportId,
      sessionId: command.sessionId,
      token,
      createdAt: now.toISOString(),
    };
  }
}
