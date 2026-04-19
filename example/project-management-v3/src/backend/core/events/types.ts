export interface DomainEvent {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
  occurredAt: Date;
}

export interface DomainEventAttributes {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: Record<string, any> | string;
  metadata?: Record<string, any> | string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retries: number;
  error?: string;
  created_at: Date;
  processed_at?: Date;
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

export interface IEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishInTransaction(events: DomainEvent[], tx: any): Promise<void>;
}

export interface IEventSubscriber {
  subscribe(eventType: string, handler: EventHandler): void;
  unsubscribe(eventType: string, handler: EventHandler): void;
}
