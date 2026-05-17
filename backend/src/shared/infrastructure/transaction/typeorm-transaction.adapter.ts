import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { TransactionPort } from '../../application/ports/transaction.port';
import { runWithTransaction } from './transaction-context';

@Injectable()
export class TypeOrmTransactionAdapter implements TransactionPort {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (manager) =>
      runWithTransaction(manager, work),
    );
  }
}
