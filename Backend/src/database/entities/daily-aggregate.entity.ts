import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm'

@Entity('daily_aggregates')
@Unique(['date', 'employeeId'])
@Index(['date'])
export class DailyAggregateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'date' })
  date: string

  @Column({ name: 'employee_id', type: 'uuid', nullable: true })
  employeeId: string | null

  @Column({ name: 'active_minutes', type: 'int', default: 0 })
  activeMinutes: number

  @Column({ name: 'idle_minutes', type: 'int', default: 0 })
  idleMinutes: number

  @Column({ name: 'break_minutes', type: 'int', default: 0 })
  breakMinutes: number

  @Column({ name: 'avg_efficiency', type: 'float', nullable: true })
  avgEfficiency: number | null
}
