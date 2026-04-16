import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';
import { TurnstileDeviceEntity } from './turnstile-device.entity';

export type AccessEventType = 'entry' | 'exit';

@Entity('access_events')
@Index(['employeeId', 'timestamp'])
export class AccessEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId: string | null;

  @ManyToOne(() => EmployeeEntity, (e) => e.accessEvents, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: EmployeeEntity | null;

  @Column({ name: 'device_id', type: 'uuid', nullable: true })
  deviceId: string | null;

  @ManyToOne(() => TurnstileDeviceEntity, (d) => d.accessEvents, {
    nullable: true,
  })
  @JoinColumn({ name: 'device_id' })
  device: TurnstileDeviceEntity | null;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ name: 'event_type', type: 'varchar', length: 16 })
  eventType: AccessEventType;

  @Column({ type: 'varchar', nullable: true })
  rawCardId: string | null;

  /** Public URL path e.g. /api/files/snapshots/uuid.jpg */
  @Column({
    name: 'snapshot_url',
    type: 'varchar',
    length: 512,
    nullable: true,
  })
  snapshotUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
