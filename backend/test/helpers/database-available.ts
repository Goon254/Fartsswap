import dataSource from '../../src/database/data-source';

export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    await dataSource.query('SELECT 1');
    await dataSource.destroy();
    return true;
  } catch {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    return false;
  }
}
