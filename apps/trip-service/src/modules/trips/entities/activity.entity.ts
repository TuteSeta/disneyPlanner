import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ActivityGroup } from './activity-group.entity';
import { ActivityType } from '../enums/activity-type.enum';

@Entity('activity')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  /**
   * Optional scheduled time for the activity (HH:MM format).
   * Kept as a plain string for flexibility; scheduling logic can
   * parse or validate this in a future service layer.
   */
  @Column({ type: 'varchar', length: 5, nullable: true })
  startTime: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  endTime: string | null;

  /**
   * Controls display order within a day.
   * Lower values appear first.
   */
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  /**
   * Priority level for scheduling / conflict resolution.
   * 1 = highest priority, higher numbers = lower priority.
   */
  @Column({ type: 'int', default: 5 })
  priority: number;

  /** Free-form notes or description for this activity. */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => ActivityGroup, (group) => group.activities, { onDelete: 'CASCADE' })
  group: ActivityGroup;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
