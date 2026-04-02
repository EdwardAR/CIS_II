const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const env = {
  port: Number(process.env.PORT || 3000),
  sessionSecret: process.env.SESSION_SECRET || 'change_me_please',
  dbPath: path.resolve(process.cwd(), process.env.DB_PATH || './src/database/clinic.sqlite'),
  nodeEnv: process.env.NODE_ENV || 'development'
};

module.exports = { env };