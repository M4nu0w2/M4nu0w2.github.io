'use strict';
const { createAuthServer, configFromEnv } = require('./app.cjs');
const { createLogger } = require('./log.cjs');
const config = configFromEnv(process.env);
const log = createLogger({ level: config.logLevel });
const server = createAuthServer(config);
server.listen(config.port, '0.0.0.0', () => {
  log.info('listening', { port: config.port, loginConfigured: config.ready });
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
