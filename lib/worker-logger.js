const pino = require('pino')

/**
 * Creates a Pino logger with configurable base context.
 *
 * Call createLogger() at startup for early-boot logs (no workerId yet).
 * Re-call createLogger({ workerId, version, environment }) after WORKER_ID
 * is resolved so every subsequent log line carries worker identity
 * automatically — without manually passing fields on each call.
 *
 * @param {Object} baseFields - Fields merged into every log line's base context
 */
function createLogger(baseFields = {}) {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
    base: {
      service: 'email-campaign-worker',
      env: process.env.NODE_ENV,
      ...baseFields
    }
  })
}

module.exports = createLogger
