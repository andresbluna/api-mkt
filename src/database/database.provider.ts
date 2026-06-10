
import { Pool } from 'pg';

export const databaseProvider = {
  provide: 'PG_POOL',
  useFactory: async () => {
    return new Pool({
      user: 'tu_usuario',
      host: 'localhost',
      database: 'tu_db',
      password: 'tu_password',
      port: 5432,
    });
  },
};