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
import { Incident } from '../incidents/incident.entity.js';

@Entity('proposed_patches')
@Index(['incidentId', 'createdAt'])
export class ProposedPatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  incidentId: string;

  @ManyToOne(() => Incident, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incidentId' })
  incident: Relation<Incident>;

  @Column({ type: 'varchar', length: 120 })
  submittedBy: string;

  @Column({ type: 'text' })
  patchContent: string;

  @Column({ type: 'text', nullable: true })
  explanation: string | null;

  @Column({ type: 'jsonb' })
  affectedFiles: string[];

  @Column({ type: 'varchar', length: 40, default: 'DEVELOPER_SUBMITTED' })
  source: string;

  // SUBMITTED | SUPERSEDED | APPROVED | REJECTED
  @Column({ type: 'varchar', length: 20, default: 'SUBMITTED' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
