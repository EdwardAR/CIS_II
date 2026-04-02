const { env } = require('./config/env');
const { initDatabase } = require('./database/init-db');
const app = require('./app');

initDatabase();

app.listen(env.port, () => {
  console.log(`Servidor iniciado en http://localhost:${env.port}`);
});