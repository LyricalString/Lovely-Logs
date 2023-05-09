import { createLogger, Logger } from ".";

createLogger({
  platform: 'console',
  timestampEnabled: true,
});
Logger.info('Hello World!');