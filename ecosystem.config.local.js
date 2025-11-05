// PM2 configuration for local development
// Usage: pm2 start ecosystem.config.local.js
// Note: Make sure to source backend/.envrc or backend/.env first

module.exports = {
  apps: [
    {
      name: 'api-server',
      cwd: './backend',
      script: './dist/packages/apps/api-server/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        API_PORT: process.env.API_PORT || 8718,
        NODE_DATABASE_URL: process.env.NODE_DATABASE_URL,
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        REDIS_DB: process.env.REDIS_DB || 0,
        JWT_SECRET: process.env.JWT_SECRET || '111',
        LLM_API_KEY: process.env.LLM_API_KEY,
        LLM_BASE_URL: process.env.LLM_BASE_URL,
        LLM_MODEL_QUIZ_PARSER: process.env.LLM_MODEL_QUIZ_PARSER,
        LLM_MODEL_ANSWER_VALIDATOR: process.env.LLM_MODEL_ANSWER_VALIDATOR,
        LLM_MODEL_QUIZ_RENDERER: process.env.LLM_MODEL_QUIZ_RENDERER,
        LLM_MODEL_KNOWLEDGE_EXTRACTOR: process.env.LLM_MODEL_KNOWLEDGE_EXTRACTOR,
        QUIZ_STORAGE_PATH: process.env.QUIZ_STORAGE_PATH || './quiz-storage',
        LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
        ENABLE_DEBUG_INFO: process.env.ENABLE_DEBUG_INFO || 'true',
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '5s',
    },
  ],
};
