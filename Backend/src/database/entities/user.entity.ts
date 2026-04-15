import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Role } from '../../common/enums/role.enum'

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column({ name: 'password_hash' })
  passwordHash: string

  @Column({ type: 'varchar', length: 32 })
  role: Role

  @Column({ name: 'is_active', default: true })
  isActive: boolean

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string | null

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: UserEntity | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
