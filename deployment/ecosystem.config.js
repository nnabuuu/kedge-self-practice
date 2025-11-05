// PM2 configuration file
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'kedge-api-server',
      cwd: '/home/ubuntu/kedge-self-practice/backend',
      script: 'npx',
      args: 'nx run api-server:serve:production',
      instances: 2,  // Number of instances (2 for load balancing)
      exec_mode: 'cluster',  // Enable cluster mode
      env: {
        NODE_ENV: 'production',
        API_PORT: 8718,
        NODE_DATABASE_URL: process.env.NODE_DATABASE_URL || 'postgres://arthur:arthur@34.84.100.187:5432/arthur-test',
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        JWT_SECRET: process.env.JWT_SECRET || 'your-production-jwt-secret-change-this',
        LLM_API_KEY: process.env.LLM_API_KEY,
        LLM_BASE_URL: process.env.LLM_BASE_URL,
        LLM_MODEL_QUIZ_PARSER: process.env.LLM_MODEL_QUIZ_PARSER,
        QUIZ_STORAGE_PATH: '/var/lib/kedge/quiz-storage',
        CORS_ORIGIN: 'https://your-domain.com',  // Your frontend domain
      },
      error_file: '/var/log/pm2/kedge-api-error.log',
      out_file: '/var/log/pm2/kedge-api-out.log',
      log_file: '/var/log/pm2/kedge-api-combined.log',
      time: true,
      max_memory_restart: '1G',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
    
    // Optional: Run frontend with serve (if not using nginx)
    // {
    //   name: 'kedge-frontend-practice',
    //   script: 'npx',
    //   args: 'serve -s /var/www/kedge-practice -p 3000',
    //   instances: 1,
    //   exec_mode: 'fork',
    // },
    
    // {
    //   name: 'kedge-frontend-quiz-parser',
    //   script: 'npx',
    //   args: 'serve -s /var/www/kedge-quiz-parser -p 3001',
    //   instances: 1,
    //   exec_mode: 'fork',
    // }
  ],
};