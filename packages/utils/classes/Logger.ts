// https://datatracker.ietf.org/doc/html/rfc5424#section-6.2.1
enum LogLevel {
  EMERGENCY = 0,
  ALERT = 1,
  CRITICAL = 2,
  ERROR = 3,
  WARNING = 4,
  NOTICE = 5,
  INFO = 6,
  DEBUG = 7,
}

const activeLogLevel = process.env.LOG_LEVEL
  ? Number(process.env.LOG_LEVEL)
  : LogLevel.INFO;

class Logger {
  /**
   * system is unusable
   */
  emergency(message: any, ...args: any[]) {
    console.error(this.level(LogLevel.EMERGENCY), message, ...args);
  }

  /**
   * action must be taken immediately
   */
  alert(message: any, ...args: any[]) {
    if (activeLogLevel < LogLevel.ALERT) return;
    console.error(this.level(LogLevel.ALERT), message, ...args);
  }

  /**
   * critical conditions
   */
  critical(message: any, ...args: any[]) {
    if (activeLogLevel < LogLevel.CRITICAL) return;
    console.error(this.level(LogLevel.CRITICAL), message, ...args);
  }

  /**
   * error conditions
   */
  error(message: any, ...args: any[]) {
    if (activeLogLevel < LogLevel.ERROR) return;
    console.warn(this.level(LogLevel.ERROR), message, ...args);
  }

  /**
   * warning conditions
   */
  warning(message: any, ...args: any[]) {
    if (activeLogLevel < LogLevel.WARNING) return;
    console.warn(this.level(LogLevel.WARNING), message, ...args);
  }

  /**
   * normal but significant condition
   */
  notice(message: any, ...args: any[]) {
    if (activeLogLevel < LogLevel.NOTICE) return;
    console.log(this.level(LogLevel.NOTICE), message, ...args);
  }

  /**
   * informational messages
   */
  info(message: any, ...args: any[]) {
    if (activeLogLevel < LogLevel.INFO) return;
    console.info(this.level(LogLevel.INFO), message, ...args);
  }

  /**
   * debug-level messages
   */
  debug(message: any, ...args: any[]) {
    if (activeLogLevel < LogLevel.DEBUG) return;
    console.debug(this.level(LogLevel.DEBUG), message, ...args);
  }

  private level(logLevel: LogLevel) {
    return `[${LogLevel[logLevel]}]`;
  }
}

export const logger = new Logger();
