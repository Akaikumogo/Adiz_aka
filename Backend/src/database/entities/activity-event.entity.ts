import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ActivityStatus } from '../../common/enums/activity-status.enum';
import { ComputerEntity } from './computer.entity';

@Entity('activity_events')
@Index(['computerId', 'timestamp'])
export class ActivityEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'computer_id', type: 'uuid' })
  computerId: string;

  @ManyToOne(() => ComputerEntity, (c) => c.activityEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'computer_id' })
  computer: ComputerEntity;

  @Column({ type: 'bigint' })
  timestamp: string;

  @Column({ type: 'varchar', length: 32 })
  status: ActivityStatus;

  @Column({ type: 'jsonb', nullable: true })
  raw: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
