import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { ComputerEntity } from './computer.entity'

@Entity('app_usage')
export class AppUsageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'computer_id', type: 'uuid' })
  computerId: string

  @ManyToOne(() => ComputerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'computer_id' })
  computer: ComputerEntity

  @Column()
  name: string

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
