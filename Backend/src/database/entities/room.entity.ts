import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { ComputerEntity } from './computer.entity'
import { EmployeeEntity } from './employee.entity'

@Entity('rooms')
export class RoomEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ type: 'varchar', length: 64, unique: true, nullable: true })
  code: string | null

  @Column({ type: 'text', nullable: true })
  description: string | null

  @OneToMany(() => EmployeeEntity, (e) => e.room)
  employees: EmployeeEntity[]

  @OneToMany(() => ComputerEntity, (c) => c.room)
  computers: ComputerEntity[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
