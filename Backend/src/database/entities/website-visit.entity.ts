import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { ComputerEntity } from './computer.entity'

@Entity('website_visits')
export class WebsiteVisitEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'computer_id', type: 'uuid' })
  computerId: string

  @ManyToOne(() => ComputerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'computer_id' })
  computer: ComputerEntity

  @Column({ type: 'text' })
  url: string

  @Column({ name: 'title', type: 'varchar', nullable: true })
  title: string | null

  @Column({ name: 'visited_at', type: 'timestamptz' })
  visitedAt: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
