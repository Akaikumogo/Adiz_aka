import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { RoomEntity } from './room.entity'
import { EmployeeEntity } from './employee.entity'

@Entity('nvr_clips')
export class NvrClipEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string

  @ManyToOne(() => RoomEntity)
  @JoinColumn({ name: 'room_id' })
  room: RoomEntity

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId: string | null

  @ManyToOne(() => EmployeeEntity, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: EmployeeEntity | null

  @Column({ name: 'storage_url', type: 'text' })
  storageUrl: string

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null

  @Column({ type: 'varchar', length: 32, default: 'idle' })
  reason: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
