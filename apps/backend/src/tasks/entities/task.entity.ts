import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TaskStatus {
  READY = 'ready',
  RUNNING = 'running',
  FAILED = 'failed',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  task_name: string;

  @Column()
  task_schedule: string;

  @Column()
  webhook_url: string;

  @Column({ type: 'jsonb' })
  json_payload: object;

  @Column()
  max_retry: number;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.READY })
  task_status: TaskStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
