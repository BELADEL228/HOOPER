enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private static getTimestamp(): string {
    return new Date().toISOString();
  }

  private static log(level: string, message: string, context?: string, data?: any) {
    const timestamp = this.getTimestamp();
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    
    const logMessage = `${timestamp} ${level} ${contextStr} ${message}${dataStr}`;
    
    switch (level) {
      case 'ERROR':
        console.error(logMessage);
        break;
      case 'WARN':
        console.warn(logMessage);
        break;
      case 'DEBUG':
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  static debug(message: string, context?: string, data?: any) {
    this.log('DEBUG', message, context, data);
  }

  static info(message: string, context?: string, data?: any) {
    this.log('INFO', message, context, data);
  }

  static warn(message: string, context?: string, data?: any) {
    this.log('WARN', message, context, data);
  }

  static error(message: string, context?: string, data?: any) {
    this.log('ERROR', message, context, data);
  }
}

export default Logger;