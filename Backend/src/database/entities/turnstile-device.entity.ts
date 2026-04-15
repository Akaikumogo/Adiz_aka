import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { AccessEventEntity } from './access-event.entity'

export type TurnstileDirection = 'in' | 'out'

@Entity('turnstile_devices')
export class TurnstileDeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  ip: string

  @Column({ type: 'varchar', length: 8 })
  direction: TurnstileDirection

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @OneToMany(() => AccessEventEntity, (a) => a.device)
  accessEvents: AccessEventEntity[]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
