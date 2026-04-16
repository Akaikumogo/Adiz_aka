import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';
import { RoomEntity } from './room.entity';
import { ActivityEventEntity } from './activity-event.entity';

@Entity('computers')
export class ComputerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mac_address', unique: true })
  macAddress: string;

  @Column({ unique: true })
  name: string;

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId: string | null;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.computers, {
    onDelete: 'CASCADE',
  })
  employee: EmployeeEntity;

  @Column({ name: 'room_id', type: 'uuid', nullable: true })
  roomId: string | null;

  @ManyToOne(() => RoomEntity, (r) => r.computers, { nullable: true })
  @JoinColumn({ name: 'room_id' })
  room: RoomEntity | null;

  @Column({
    name: 'machine_token_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  machineTokenHash: string | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @OneToMany(() => ActivityEventEntity, (a) => a.computer)
  activityEvents: ActivityEventEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
