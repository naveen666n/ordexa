require('dotenv').config();
const env = require('./src/config/env');
const app = require('./src/app');
const sequelize = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');

const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to Redis
    connectRedis();

    // Connect to MySQL
    await sequelize.authenticate();
    console.log('✅ MySQL connected');

    // Sync models (development only — use migrations in production)
    if (env.NODE_ENV === 'development') {
      // Do NOT use sync in production — use migrations
      // await sequelize.sync({ alter: true });
    }

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT} [${env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
