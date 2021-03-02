'use strict'

//
// Internal logging for the Elastic APM Node.js Agent.
//
// Promised interface:
// - The amount of logging can be controlled via the `logLevel` config var,
//   and via the `log_level` central config var.
// - A custom logger can be provided via the `logging` config var.
//
// Nothing else about this package's logging (e.g. structure or the particular
// message text) is promised/stable.
//
// Per https://github.com/elastic/apm/blob/master/specs/agents/logging.md
// the valid log levels are:
//  - trace
//  - debug
//  - info (default)
//  - warning
//  - error
//  - critical
//  - off
//
// Before this spec, the supported levels were:
//  - trace
//  - debug
//  - info (default)
//  - warn - both "warn" and "warning" will be supported for backward compat
//  - error
//  - fatal - mapped to "critical" for backward compat

// TODO: @elastic/ecs-pino-format
var ecsFormat = require('@elastic/ecs-pino-format')
var pino = require('pino')

const DEFAULT_LOG_LEVEL = 'info'

// Used to mark loggers created here, for use by `isLoggerCustom()`.
const LOGGER_IS_OURS_SYM = Symbol('ElasticAPMLoggerIsOurs')

const PINO_LEVEL_FROM_LEVEL_NAME = {
  trace: 'trace',
  debug: 'debug',
  info: 'info',
  warning: 'warn',
  warn: 'warn', // Supported for backwards compat
  error: 'error',
  critical: 'fatal',
  fatal: 'fatal', // Supported for backwards compat
  off: 'silent'
}

function createLogger (levelName) {
  if (!levelName) {
    levelName = DEFAULT_LOG_LEVEL
  }

  let pinoLevel = PINO_LEVEL_FROM_LEVEL_NAME[levelName]
  if (!pinoLevel) {
    // For backwards compat, support an earlier bug where an unknown log level
    // was accepted.
    // TODO: Consider being more strict on this for v4.0.0.
    pinoLevel = 'trace'
  }

  const logger = pino(
    {
      level: pinoLevel,
      ...ecsFormat()
    },
    pino.destination(process.stderr.fd)
  )
  // TODO(trentm): Perhaps flip this if this is a de-opt issue.
  logger[LOGGER_IS_OURS_SYM] = true // used for isLoggerCustom()

  return logger
}

function isLoggerCustom (logger) {
  return !logger[LOGGER_IS_OURS_SYM]
}

module.exports = {
  DEFAULT_LOG_LEVEL: DEFAULT_LOG_LEVEL,
  createLogger: createLogger,
  isLoggerCustom: isLoggerCustom
}
