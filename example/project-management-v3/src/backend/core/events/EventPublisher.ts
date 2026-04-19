import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/connection.js';
import { logger } from '../../utils/logger.js';
import { singleton } from 'tsyringe';
import type { DomainEvent, DomainEventAttributes, EventHandler } from './types.js';

@singleton()
export class EventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    await db.execute(
      `INSERT INTO domain_events (id, event_type, aggregate_type, aggregate_id, payload, metadata, status, retries, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, NOW())`,
      [
        event.id,
        event.eventType,
        event.aggregateType,
        event.aggregateId,
        JSON.stringify(event.payload),
        event.metadata ? JSON.stringify(event.metadata) : null
      ]
    );
    logger.debug(`Event published: ${event.eventType}`, { aggregateId: event.aggregateId });
  }

  async publishInTransaction(events: DomainEvent[], tx: any): Promise<void> {
    if (events.length === 0) return;

    for (const event of events) {
      await tx.execute(
        `INSERT INTO domain_events (id, event_type, aggregate_type, aggregate_id, payload, metadata, status, retries, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, NOW())`,
        [
          event.id,
          event.eventType,
          event.aggregateType,
          event.aggregateId,
          JSON.stringify(event.payload),
          event.metadata ? JSON.stringify(event.metadata) : null
        ]
      );
    }
    logger.debug(`Published ${events.length} events in transaction`);
  }

  static createEvent(params: {
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, any>;
    metadata?: Record<string, any>;
  }): DomainEvent {
    return {
      id: uuidv4(),
      eventType: params.eventType,
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      payload: params.payload,
      metadata: params.metadata,
      occurredAt: new Date()
    };
  }
}

@singleton()
export class EventSubscriber {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    logger.debug(`Subscribed handler to event: ${eventType}`);
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(eventType);
    if (eventHandlers) {
      const index = eventHandlers.indexOf(handler);
      if (index > -1) {
        eventHandlers.splice(index, 1);
      }
    }
  }

  async handle(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Event handler error for ${event.eventType}:`, error instanceof Error ? error : undefined);
        throw error;
      }
    }
  }

  getHandlers(eventType: string): EventHandler[] {
    return this.handlers.get(eventType) || [];
  }
}

@singleton()
export class EventProcessor {
  constructor(
    private eventPublisher: EventPublisher,
    private eventSubscriber: EventSubscriber
  ) {}

  async processPendingEvents(limit: number = 10): Promise<number> {
    const pendingEvents = await db.query<any>(
      `SELECT * FROM domain_events 
       WHERE status = 'pending' AND retries < 3 
       ORDER BY created_at ASC 
       LIMIT ?`,
      [limit]
    );

    let processedCount = 0;

    for (const eventAttr of pendingEvents) {
      try {
        await db.execute(
          `UPDATE domain_events SET status = 'processing', processed_at = NOW() WHERE id = ?`,
          [eventAttr.id]
        );

        const event: DomainEvent = {
          id: eventAttr.id,
          eventType: eventAttr.event_type,
          aggregateType: eventAttr.aggregate_type,
          aggregateId: eventAttr.aggregate_id,
          payload: typeof eventAttr.payload === 'string' ? JSON.parse(eventAttr.payload) : eventAttr.payload,
          metadata: eventAttr.metadata ? (typeof eventAttr.metadata === 'string' ? JSON.parse(eventAttr.metadata) : eventAttr.metadata) : undefined,
          occurredAt: eventAttr.created_at
        };

        await this.eventSubscriber.handle(event);

        await db.execute(
          `UPDATE domain_events SET status = 'completed', processed_at = NOW() WHERE id = ?`,
          [eventAttr.id]
        );

        processedCount++;
        logger.debug(`Event processed successfully: ${event.eventType}`, { eventId: event.id });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        await db.execute(
          `UPDATE domain_events 
           SET status = 'failed', 
               retries = retries + 1, 
               error = ?
           WHERE id = ?`,
          [errorMessage, eventAttr.id]
        );

        if (eventAttr.retries + 1 >= 3) {
          await db.execute(
            `UPDATE domain_events SET status = 'failed' WHERE id = ?`,
            [eventAttr.id]
          );
        } else {
          await db.execute(
            `UPDATE domain_events SET status = 'pending' WHERE id = ?`,
            [eventAttr.id]
          );
        }

        logger.error(`Event processing failed: ${eventAttr.event_type}`, error instanceof Error ? error : undefined);
      }
    }

    return processedCount;
  }

  async retryFailedEvents(limit: number = 10): Promise<number> {
    await db.execute(
      `UPDATE domain_events 
       SET status = 'pending', error = NULL 
       WHERE status = 'failed' AND retries < 3 
       LIMIT ?`,
      [limit]
    );

    return this.processPendingEvents(limit);
  }
}

export const eventPublisher = new EventPublisher();
export const eventSubscriber = new EventSubscriber();
