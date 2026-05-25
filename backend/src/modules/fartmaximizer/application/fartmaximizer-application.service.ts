import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppConfigService } from '../../../config/config.service';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import {
  directionToDelta,
  sanitizeFartmaxField,
  type FartmaxVoteDirection,
} from '../domain/fartmaximizer-input';
import { FartmaxMealEntity } from '../infrastructure/persistence/fartmax-meal.entity';
import { FartmaxVoteEntity } from '../infrastructure/persistence/fartmax-vote.entity';

export interface FartmaxMealRow {
  id: string;
  name: string;
  description: string;
  votes: number;
  upvoteCount: number;
  downvoteCount: number;
  createdAt: string;
}

export interface FartmaximizerLeaderboardResult {
  enabled: boolean;
  meals: FartmaxMealRow[];
  myVotes: Record<string, FartmaxVoteDirection>;
}

@Injectable()
export class FartmaximizerApplicationService {
  constructor(
    @InjectRepository(FartmaxMealEntity)
    private readonly meals: Repository<FartmaxMealEntity>,
    @InjectRepository(FartmaxVoteEntity)
    private readonly votes: Repository<FartmaxVoteEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly config: AppConfigService,
  ) {}

  async getLeaderboard(args: {
    sessionId?: string;
    limit?: number;
  }): Promise<FartmaximizerLeaderboardResult> {
    if (!this.config.fartmaximizer.enabled) {
      return { enabled: false, meals: [], myVotes: {} };
    }

    const cap = Math.min(Math.max(args.limit ?? 50, 1), 100);
    const rows = await this.meals.find({
      where: { status: 'active' },
      order: { voteScore: 'DESC', createdAt: 'ASC' },
      take: cap,
    });

    const myVotes: Record<string, FartmaxVoteDirection> = {};
    if (args.sessionId) {
      const sessionVotes = await this.votes.find({
        where: { voterSessionId: args.sessionId },
        select: ['mealId', 'direction'],
      });
      for (const v of sessionVotes) {
        myVotes[v.mealId] = v.direction === 1 ? 'up' : 'down';
      }
    }

    return {
      enabled: true,
      meals: rows.map((r) => this.toMealRow(r)),
      myVotes,
    };
  }

  async submitMeal(args: {
    sessionId: string;
    name: string;
    description?: string;
  }): Promise<FartmaxMealRow> {
    this.assertEnabled();
    const name = sanitizeFartmaxField(args.name, 120);
    if (!name) throw new BadRequestException('Meal combination name is required');
    const description =
      sanitizeFartmaxField(args.description ?? '', 160) ||
      'Community filing pending Bureau review. Assume maximum volatility.';

    const now = this.clock.now();
    const entity = this.meals.create({
      id: this.ids.generate(),
      name,
      description,
      voteScore: 0,
      upvoteCount: 0,
      downvoteCount: 0,
      submitterSessionId: args.sessionId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    await this.meals.save(entity);
    return this.toMealRow(entity);
  }

  async castVote(args: {
    sessionId: string;
    mealId: string;
    direction: FartmaxVoteDirection;
  }): Promise<FartmaximizerLeaderboardResult> {
    this.assertEnabled();
    const delta = directionToDelta(args.direction);

    await this.dataSource.transaction(async (manager) => {
      const mealRepo = manager.getRepository(FartmaxMealEntity);
      const voteRepo = manager.getRepository(FartmaxVoteEntity);

      const meal = await mealRepo.findOne({ where: { id: args.mealId } });
      if (!meal || meal.status !== 'active') {
        throw new NotFoundException('Meal combination not found');
      }

      const existing = await voteRepo.findOne({
        where: { mealId: args.mealId, voterSessionId: args.sessionId },
      });

      const now = this.clock.now();

      if (!existing) {
        await voteRepo.save(
          voteRepo.create({
            id: this.ids.generate(),
            mealId: args.mealId,
            voterSessionId: args.sessionId,
            direction: delta,
            createdAt: now,
            updatedAt: now,
          }),
        );
        if (delta === 1) {
          meal.upvoteCount += 1;
        } else {
          meal.downvoteCount += 1;
        }
        meal.voteScore += delta;
      } else if (existing.direction === delta) {
        return;
      } else {
        existing.direction = delta;
        existing.updatedAt = now;
        await voteRepo.save(existing);
        if (delta === 1) {
          meal.upvoteCount += 1;
          meal.downvoteCount = Math.max(0, meal.downvoteCount - 1);
          meal.voteScore += 2;
        } else {
          meal.downvoteCount += 1;
          meal.upvoteCount = Math.max(0, meal.upvoteCount - 1);
          meal.voteScore -= 2;
        }
      }

      meal.updatedAt = now;
      await mealRepo.save(meal);
    });

    return this.getLeaderboard({ sessionId: args.sessionId, limit: 100 });
  }

  private assertEnabled(): void {
    if (!this.config.fartmaximizer.enabled) {
      throw new ForbiddenException('Fartmaximizer Lab is not enabled');
    }
  }

  private toMealRow(entity: FartmaxMealEntity): FartmaxMealRow {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      votes: entity.voteScore,
      upvoteCount: entity.upvoteCount,
      downvoteCount: entity.downvoteCount,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
