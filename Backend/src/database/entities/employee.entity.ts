import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { DepartmentEntity } from './department.entity'
import { RoomEntity } from './room.entity'
import { AccessEventEntity } from './access-event.entity'
import { ComputerEntity } from './computer.entity'

@Entity('employees')
export class EmployeeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'full_name' })
  fullName: string

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null

  @ManyToOne(() => DepartmentEntity, (d) => d.employees, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: DepartmentEntity | null

  @Column({ type: 'varchar', length: 255, default: '' })
  position: string

  @Column({ name: 'card_id', type: 'varchar', length: 128, unique: true, nullable: true })
  cardId: string | null

  @Column({ name: 'room_id', type: 'uuid', nullable: true })
  roomId: string | null

  @ManyToOne(() => RoomEntity, (r) => r.employees, { nullable: true })
  @JoinColumn({ name: 'room_id' })
  room: RoomEntity | null

  @Column({ name: 'work_start', type: 'varchar', length: 32, default: '09:00' })
  workStart: string

  @Column({ name: 'work_end', type: 'varchar', length: 32, default: '18:00' })
  workEnd: string

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @OneToMany(() => AccessEventEntity, (a) => a.employee)
  accessEvents: AccessEventEntity[]

  @OneToMany(() => ComputerEntity, (c) => c.employee)
  computers: ComputerEntity[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
