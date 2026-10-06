'use strict';
const { createAuthServer, configFromEnv } = require('./app.cjs');
const config = configFromEnv(process.env);
const server = createAuthServer(config);
server.listen(config.port, '0.0.0.0', () => {
  console.log(`NutriPro listening on port ${config.port}; Google login ${config.ready ? 'configured' : 'not configured (access closed)'}`);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
