import { PostgresStore, PgVector } from '@mastra/pg';

console.log('[STORAGE INIT] Module being loaded - DATABASE_URL hostname:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);

export const postgresStore = new PostgresStore({
  connectionString: process.env.DATABASE_URL!,
});

export const pgVector = new PgVector({
  connectionString: process.env.DATABASE_URL!,
});
