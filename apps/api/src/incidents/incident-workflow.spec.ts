import { describe, expect, it } from 'vitest';
import type { IncidentEvent } from './incident-event.entity.js';
import {
  canTransition,
  canTransitionManually,
  visibleEvents,
} from './incident-workflow.js';

const event = (eventType: string): IncidentEvent =>
  ({
    id: eventType,
    eventType,
    previousStatus: 'RECEIVED',
    newStatus: 'DIAGNOSIS',
    actor: 'user:dev-1',
    description: 'internal text',
    metadata: { note: 'secret note' },
    createdAt: new Date(),
  }) as unknown as IncidentEvent;

describe('incident workflow', () => {
  it('allows the planned path and blocks shortcuts', () => {
    expect(canTransition('RECEIVED', 'DIAGNOSIS')).toBe(true);
    expect(canTransition('RECEIVED', 'RESOLVED')).toBe(false);
    expect(canTransition('VERIFICATION', 'RESOLVED')).toBe(false);
    expect(canTransition('AWAITING_APPROVAL', 'RESOLVED')).toBe(true);
    expect(canTransition('RESOLVED', 'DIAGNOSIS')).toBe(false);
  });

  it('only lets developers move statuses by hand from early stages', () => {
    expect(canTransitionManually('RECEIVED', 'DIAGNOSIS')).toBe(true);
    expect(canTransitionManually('DIAGNOSIS', 'DUPLICATE')).toBe(true);
    expect(canTransitionManually('AWAITING_APPROVAL', 'DIAGNOSIS')).toBe(false);
    expect(canTransitionManually('VERIFICATION', 'AWAITING_APPROVAL')).toBe(
      false,
    );
  });

  it('shows reporters only status events, without internal fields', () => {
    const events = [event('STATUS_CHANGED'), event('VERIFICATION_RUN')];
    const reporterView = visibleEvents(events, false);
    expect(reporterView).toHaveLength(1);
    expect(reporterView[0]).not.toHaveProperty('actor');
    expect(reporterView[0]).not.toHaveProperty('metadata');
    expect(reporterView[0]).not.toHaveProperty('description');
    expect(visibleEvents(events, true)).toHaveLength(2);
  });
});
