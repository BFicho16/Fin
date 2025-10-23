import { PostgresStore, PgVector } from '@mastra/pg';

export const postgresStore = new PostgresStore({
  connectionString: process.env.DATABASE_URL!,
});

export const pgVector = new PgVector({
  connectionString: process.env.DATABASE_URL!,
});
