import { Logger } from '@nestjs/common';
import dataSource from './data-source';

export async function runMigrations(): Promise<void> {
  const logger = new Logger('Migrations');
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  const executed = await dataSource.runMigrations();
  if (executed.length === 0) {
    logger.log('No pending migrations');
  } else {
    logger.log(`Ran ${executed.length} migration(s): ${executed.map((m) => m.name).join(', ')}`);
  }
  await dataSource.destroy();
}
