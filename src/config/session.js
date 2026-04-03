const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const { env } = require('./env');

const sessionMiddleware = session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: 'src/database'
  }),
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8
  }
});

module.exports = { sessionMiddleware };