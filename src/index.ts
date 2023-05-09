export interface loggerOptions {
  platform: 'web' | 'console';
  timestampEnabled?: boolean;
}

/**
 * Nice log with pretty colors.
 */
class logger {
  private static platform: 'web' | 'console';
  private static timeStampEnabled: boolean;

  constructor ({
    platform,
    timestampEnabled = true,
  }: {
    platform: 'web' | 'console'
    timestampEnabled?: boolean
  }) {
    logger.platform = platform;
    logger.timeStampEnabled = timestampEnabled;
  }
  private static timer: number = Date.now()


  /**
   * Text of the modes like 'INFO', 'WARN', etc.
   */
  modeText = {
    "web": {
      info: 'INFO',
      warn: 'WARN',
      error: 'ERROR',
      success: 'OK'
    },
    "console": {
      info: '\x1b[36mℹ\x1b[0m', // cyan 'i'
      warn: '\x1b[33m⚠\x1b[0m', // yellow '!'
      error: '\x1b[31m✖\x1b[0m', // red 'x'
      success: '\x1b[32m✔\x1b[0m', // green '√'
      time: '\x1b[33m⏱\x1b[0m', // yellow '⏱'
      title: '\x1b[1m' // bold
    }
  };

  /**
   * CSS styles. e.g. 'color: blue'
   */
  logStyle = {
    info: 'background: #3880ff; color: #ffffff; border-radius: 3px; padding: 0 5px; font-weight: bold;',
    success: 'background: #10dc60; color: #ffffff; border-radius: 3px; padding: 0 5px',
    warning: 'background: #ffce00; color: #ffffff; border-radius: 3px; padding: 0 5px',
    danger: 'background: #f04141; color: #ffffff; border-radius: 3px; padding: 0 5px',
    time: 'color: #ffce00',
    title: 'font-size: 1.5rem'
  };

  /**
   * Returns a time in milliseconds.
   * Either in high resolution (if supported, nanoseconds) from app start time or milliseconds since 1970.
   */
  public static getTime(): string {
    const seconds = (Date.now() - logger.timer) / 1000;
    return seconds.toFixed(3);
  }

  /**
   * Prints a more custom log. This is not the recommended way to log. Use the other methods like .info(...).
   * @param modeText Mode text like 'INFO'.
   * @param printTime Prints the time stamp.
   * @param msgs One or more messages. (same you pass in console.log(...))
   */
  custom(modeText: string, style: string, printTime: boolean, ...msgs: any[]): void {
    switch (logger.platform) {
      case 'web':
        console.log(`%c${modeText}%c${printTime ? ` [${logger.getTime()}]` : ''}`, style, this.logStyle.time, ...msgs);
        break;
      case 'console':
        if (style) throw new Error('Style is not supported in console mode.');
        console.log(`${printTime ? `\x1b[36m[${logger.getTime()}]\x1b[0m ` : ''}${modeText}`, ...msgs);
        break;
    }
  }

  /**
   * Prints an info message. Like console.log().
   * @param msgs One or more messages. (same you pass in console.log(...))
   */
  info(...msgs: any[]): void {
    switch (logger.platform) {
      case 'web':
        this.custom(this.modeText["web"].info, this.logStyle.info, logger.timeStampEnabled, ...msgs);
        break;
      case 'console':
        this.custom(this.modeText["console"].info, '', logger.timeStampEnabled, ...msgs);
        break;
    }
  }

  /**
   * Prints a warning message. Like console.warn().
   * @param msgs One or more messages. (same you pass in console.log(...))
   */
  warn(...msgs: any[]): void {
    switch (logger.platform) {
      case 'web':
        this.custom(this.modeText["web"].warn, this.logStyle.warning, logger.timeStampEnabled, ...msgs);
        break;
      case 'console':
        this.custom(this.modeText["console"].warn, '', logger.timeStampEnabled, ...msgs);
        break;
    }
  }

  /**
   * Prints an error message. Like console.error().
   * @param msgs One or more messages. (same you pass in console.log(...))
   */
  error(...msgs: any[]): void {
    switch (logger.platform) {
      case 'web':
        this.custom(this.modeText["web"].error, this.logStyle.danger, logger.timeStampEnabled, ...msgs);
        break;
      case 'console':
        this.custom(this.modeText["console"].error, '', logger.timeStampEnabled, ...msgs);
        break;
    }
  }

  /**
   * Prints a successful message. A green message for OK or DONE.
   * @param msgs One or more messages. (same you pass in console.log(...))
   */
  success(...msgs: any[]): void {
    switch (logger.platform) {
      case 'web':
        this.custom(this.modeText['web'].success, this.logStyle.success, logger.timeStampEnabled, ...msgs);
        break;
      case 'console':
        this.custom(this.modeText["console"].success, '', logger.timeStampEnabled, ...msgs);
        break;
    }
  }
}

let loggerInstance: logger | null = null;

export const createLogger = (options: loggerOptions): void => {
  loggerInstance = new logger(options);
}

const getLogger = (): logger => {
  if (!loggerInstance) {
    loggerInstance = new logger({
      platform: 'web',
      timestampEnabled: true,
    });
  }
  return loggerInstance;
}

export const Logger = getLogger();