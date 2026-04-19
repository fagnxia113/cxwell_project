import { singleton, inject } from 'tsyringe';
import { EventProcessor } from './EventPublisher.js';
import { logger } from '../../utils/logger.js';

@singleton()
export class EventScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(
    @inject('EventProcessor') private eventProcessor: EventProcessor
  ) {}

  start(intervalMs: number = 5000): void {
    if (this.isRunning) {
      logger.warn('EventScheduler is already running');
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      try {
        const processed = await this.eventProcessor.processPendingEvents(10);
        if (processed > 0) {
          logger.debug(`Processed ${processed} events`);
        }
      } catch (error) {
        logger.error('EventScheduler error:', error instanceof Error ? error : undefined);
      }
    }, intervalMs);

    logger.info(`EventScheduler started with interval ${intervalMs}ms`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      logger.info('EventScheduler stopped');
    }
  }

  async processNow(limit: number = 10): Promise<number> {
    return this.eventProcessor.processPendingEvents(limit);
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
