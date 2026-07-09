import pino from 'pino'
import * as Sentry from '@sentry/nextjs'

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  }),
  base: {
    env: process.env.NODE_ENV,
    service: 'email-campaign-api'
  }
})

const sanitizeLogObject = (obj: any): any => {
  if (obj instanceof Error) {
    return {
      message: obj.message,
      stack: obj.stack,
      name: obj.name,
      ...(obj as any).Code && { Code: (obj as any).Code },
      ...(obj as any).name && { name: (obj as any).name }
    }
  }
  if (typeof obj === 'object' && obj !== null) {
    const cleaned: any = {}
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (val instanceof Error) {
        cleaned[key] = {
          message: val.message,
          stack: val.stack,
          name: val.name,
          ...(val as any).Code && { Code: (val as any).Code },
          ...(val as any).Type && { Type: (val as any).Type }
        }
      } else if (typeof val === 'object' && val !== null) {
        // Deep copy of simple fields or conversion to safe description
        try {
          if (Array.isArray(val)) {
            cleaned[key] = val.map(v => (typeof v === 'object' ? '[Object]' : v))
          } else {
            cleaned[key] = {
              ...(val.message && { message: val.message }),
              ...(val.Code && { Code: val.Code }),
              ...(val.id && { id: val.id }),
              ...(val.name && { name: val.name }),
            }
            if (Object.keys(cleaned[key]).length === 0) {
              cleaned[key] = '[Object]'
            }
          }
        } catch {
          cleaned[key] = '[Object]'
        }
      } else {
        cleaned[key] = val
      }
    }
    return cleaned
  }
  return obj
}

const logger = {
  ...baseLogger,
  info: (first: any, ...args: any[]) => {
    try {
      baseLogger.info(sanitizeLogObject(first), ...args)
    } catch {
      baseLogger.info(String(first))
    }
  },
  warn: (first: any, ...args: any[]) => {
    try {
      baseLogger.warn(sanitizeLogObject(first), ...args)
    } catch {
      baseLogger.warn(String(first))
    }
  },
  error: (first: any, ...args: any[]) => {
    try {
      const safeFirst = sanitizeLogObject(first)
      baseLogger.error(safeFirst, ...args)
    } catch (e) {
      baseLogger.error(String(first))
    }

    try {
      if (first instanceof Error) {
        if (!(first as any).__sentry_captured__) {
          (first as any).__sentry_captured__ = true;
          Sentry.captureException(first);
        }
      } else if (typeof first === 'object' && first !== null) {
        const errObj = first.err || first.error;
        if (errObj instanceof Error) {
          if (!(errObj as any).__sentry_captured__) {
            (errObj as any).__sentry_captured__ = true;
            Sentry.captureException(errObj);
          }
        } else {
          const msg = first.msg || first.message || JSON.stringify(first);
          Sentry.captureMessage(msg);
        }
      } else if (typeof first === 'string') {
        const errArg = args.find(arg => arg instanceof Error);
        if (errArg) {
          if (!(errArg as any).__sentry_captured__) {
            (errArg as any).__sentry_captured__ = true;
            Sentry.captureException(errArg);
          }
        } else {
          Sentry.captureMessage(first);
        }
      }
    } catch (sentryErr) {
      // Prevent logging issues from affecting the application
    }
  }
} as any

export default logger
