/**
 * Nice log with pretty colors.
 */
export class Logger {
  private static timer = typeof window !== 'undefined' ? window.performance || Date : Date;

  /**
   * Text of the modes like 'INFO', 'WARN', etc.
   */
  public static modeText = {
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
    success: 'OK'
  };

  /**
   * CSS styles. e.g. 'color: blue'
   */
  public static logStyle = {
    info: 'background: #3880ff; color: #ffffff; border-radius: 3px; padding: 0 5px; font-weight: bold;',
    success: 'background: #10dc60; color: #ffffff; border-radius: 3px; padding: 0 5px',
    warning: 'background: #ffce00; color: #ffffff; border-radius: 3px; padding: 0 5px',
    danger: 'background: #f04141; color: #ffffff; border-radius: 3px; padding: 0 5px',
    time: 'color: #ffce00',
    title: 'font-size: 1.5rem'
  };

  /**
   * Time stamps option.
   */
  public static timeStampEnabled = true;

  /**
   * Returns a time in milliseconds.
   * Either in high resolution (if supported, nanoseconds) from app start time or milliseconds since 1970.
   */
  public static getTime(): number {
    return parseFloat((this.timer.now() / 1000).toFixed(3));
  }

  /**
   * Prints a more custom log. This is not the recommended way to log. Use the other methods like .info(...).
   * @param modeText Mode text like 'INFO'.
   * @param style CSS stlyes like 'color: blue'.
   * @param printTime Prints the time stamp.
   * @param msgs One or more messages. (same you pass in console.log(...))
   */
  public static custom(modeText: string, style: string, printTime: boolean, ...msgs: any[]): void {
    console.log(`%c${modeText}%c${printTime ? ` [${this.getTime()}]` : ''}`, style, this.logStyle.time, ...msgs);
  }

  /**
   * Prints text with large font.
   * @param title Some text.
   */
  public static title(title: string): void {
    this.custom(title, this.logStyle.title, false);
  }

  /**
   * Prints an info message. Like console.log().
   * @param msgs One or more messages. (same you pass in console.log(...))
   */
  public static info(...msgs: any[]): void {
    this.custom(this.modeText.info, this.logStyle.info, this.timeStampEnabled, ...msgs);
  }

  /**
   * Prints a warning message. Like console.warn().
   * @param msgs One or more messages. (same you pass in console.log(...))
   */
  public static warn(...msgs: any[]): void {
    this.custom(this.modeText.warn, this.logStyle.warning, this.timeStampEnabled, ...msgs);
  }

  /**
   * Prints an error message. Like console.error().
   * @param msgs One or more messages. (same you pass in console.log(...))
   */
  public static error(...msgs: any[]): void {
    this.custom(this.modeText.error, this.logStyle.danger, this.timeStampEnabled, ...msgs);
  }

  /**
   * Prints a successful message. A green message for OK or DONE.
   * @param msgs One or more messages. (same you pass in console.log(...))
   */
  public static success(...msgs: any[]): void {
    this.custom(this.modeText.success, this.logStyle.success, this.timeStampEnabled, ...msgs);
  }
}