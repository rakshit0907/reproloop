import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ProposedPatch } from './proposed-patch.entity.js';

@Entity('verification_runs')
@Index(['patchId', 'startedAt'])
export class VerificationRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  patchId: string;

  @ManyToOne(() => ProposedPatch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patchId' })
  patch: Relation<ProposedPatch>;

  // PASSED | FAILED | INCONCLUSIVE | NOT_RUN
  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', length: 200 })
  command: string;

  @Column({ type: 'int', nullable: true })
  exitCode: number | null;

  @Column({ type: 'text' })
  stdout: string;

  @Column({ type: 'text' })
  stderr: string;

  @Column({ type: 'int', nullable: true })
  testsRun: number | null;

  @Column({ type: 'int', nullable: true })
  testsFailed: number | null;

  @Column({ type: 'int' })
  durationMs: number;

  @Column({ type: 'varchar', length: 200 })
  repository: string;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz' })
  completedAt: Date;
}
