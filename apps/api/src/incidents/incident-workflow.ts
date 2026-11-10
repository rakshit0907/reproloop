import type { IncidentEvent } from './incident-event.entity.js';
import type { IncidentStatus } from './incident-status.js';

const TRANSITIONS: Partial<Record<IncidentStatus, readonly IncidentStatus[]>> =
  {
    RECEIVED: ['DIAGNOSIS', 'CANCELLED'],
    DIAGNOSIS: [
      'NEEDS_MORE_INFORMATION',
      'PATCH_GENERATION',
      'DUPLICATE',
      'CANCELLED',
    ],
    NEEDS_MORE_INFORMATION: ['DIAGNOSIS', 'CANCELLED'],
    PATCH_GENERATION: ['VERIFICATION', 'CANCELLED'],
    VERIFICATION: ['AWAITING_APPROVAL', 'VERIFICATION_FAILED'],
    VERIFICATION_FAILED: ['PATCH_GENERATION', 'DIAGNOSIS', 'CANCELLED'],
    AWAITING_APPROVAL: ['RESOLVED', 'DIAGNOSIS'],
  };

// Statuses a developer may request directly through the API.
export const MANUAL_TARGETS = [
  'DIAGNOSIS',
  'NEEDS_MORE_INFORMATION',
  'DUPLICATE',
  'CANCELLED',
] as const;

// Statuses from which a manual move is allowed. All others are driven by
// patch, verification and approval actions.
const MANUAL_FROM: readonly string[] = [
  'RECEIVED',
  'DIAGNOSIS',
  'NEEDS_MORE_INFORMATION',
];

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from as IncidentStatus] ?? []).includes(
    to as IncidentStatus,
  );
}

export function canTransitionManually(from: string, to: string): boolean {
  return MANUAL_FROM.includes(from) && canTransition(from, to);
}

const REPORTER_VISIBLE_EVENTS = ['REPORT_RECEIVED', 'STATUS_CHANGED'];

export function toEventView(event: IncidentEvent, staff: boolean) {
  if (staff) {
    return {
      id: event.id,
      eventType: event.eventType,
      previousStatus: event.previousStatus,
      newStatus: event.newStatus,
      actor: event.actor,
      description: event.description,
      metadata: event.metadata,
      createdAt: event.createdAt,
    };
  }
  return {
    id: event.id,
    eventType: event.eventType,
    newStatus: event.newStatus,
    createdAt: event.createdAt,
  };
}

export function visibleEvents(events: IncidentEvent[], staff: boolean) {
  return events
    .filter((e) => staff || REPORTER_VISIBLE_EVENTS.includes(e.eventType))
    .map((e) => toEventView(e, staff));
}
