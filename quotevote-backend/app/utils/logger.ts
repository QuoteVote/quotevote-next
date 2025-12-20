import { logger } from './logger';

export function logMessage(message: string): void {
  logger.info(`Message: ${message}`);
}

export function logError(error: string): void {
  logger.error(`Error: ${error}`);
}
