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

// Allow running as a standalone CLI: `node dist/database/run-migrations.js`.
// Useful as a K8s initContainer / pre-deploy step when boot-time migrations
// are disabled via DATABASE_RUN_MIGRATIONS=false.
if (require.main === module) {
  runMigrations()
    .then(() => {
       
      console.log('Migrations complete.');
      process.exit(0);
    })
    .catch((error: unknown) => {
       
      console.error('Migrations failed', error);
      process.exit(1);
    });
}
