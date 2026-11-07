import { DataSource } from 'typeorm';
import { entities } from './entities.js';

process.loadEnvFile('.env');

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities,
  migrations: ['dist/database/migrations/*.js'],
});
