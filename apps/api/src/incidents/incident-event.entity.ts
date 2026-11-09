import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Incident } from './incident.entity.js';

@Entity('incident_events')
@Index(['incidentId', 'createdAt'])
export class IncidentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  incidentId: string;

  @ManyToOne(() => Incident, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incidentId' })
  incident: Relation<Incident>;

  @Column({ type: 'varchar', length: 60 })
  eventType: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  previousStatus: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  newStatus: string | null;

  @Column({ type: 'varchar', length: 120 })
  actor: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
