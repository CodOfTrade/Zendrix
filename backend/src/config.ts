import 'dotenv/config';

type SigeMode = 'mock' | 'live';

export interface AppConfig {
  env: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  pepper: string;
  rateLimitMax: number;
  rateLimitWindow: number;
  frontendUrl: string;
  sige: {
    mode: SigeMode;
    baseUrl: string;
    token: string;
    osEndpoint: string;
    osFlagField: string;
  };
  email: {
    from: string;
    host: string;
    port: number;
    user?: string;
    pass?: string;
  };
  storage: {
    driver: 'local';
    path: string;
  };
}

export const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://zendrix:zendrix@localhost:5432/zendrix',
  jwtSecret: process.env.JWT_SECRET || 'jwt-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'jwt-refresh-secret',
  pepper: process.env.PEPPER || 'pepper',
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 10),
  rateLimitWindow: Number(process.env.RATE_LIMIT_WINDOW || 60000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  sige: {
    mode: (process.env.SIGE_MODE as SigeMode) || 'mock',
    baseUrl: process.env.SIGE_BASE_URL || 'https://api.sigecloud.com.br',
    token: process.env.SIGE_TOKEN || '',
    osEndpoint: process.env.SIGE_OS_ENDPOINT || '/orders',
    osFlagField: process.env.SIGE_OS_FLAG_FIELD || 'is_os'
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@zendrix.local',
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT || 1025),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  storage: {
    driver: 'local',
    path: process.env.FILE_STORAGE_PATH || './uploads'
  }
};
