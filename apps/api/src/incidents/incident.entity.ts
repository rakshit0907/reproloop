import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Project } from '../projects/project.entity.js';
import { User } from '../users/user.entity.js';

@Entity('incidents')
@Index(['projectId', 'status'])
@Index(['reporterId'])
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Relation<Project>;

  @Column({ type: 'uuid' })
  reporterId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reporterId' })
  reporter: Relation<User>;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  expectedBehavior: string | null;

  @Column({ type: 'text', nullable: true })
  actualBehavior: string | null;

  @Column({ type: 'text', nullable: true })
  reproductionSteps: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  severity: string | null;

  @Column({ type: 'varchar', length: 40, default: 'RECEIVED' })
  status: string;

  @Column({ type: 'boolean', default: false })
  diagnosticsConsent: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  diagnosticsConsentAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
