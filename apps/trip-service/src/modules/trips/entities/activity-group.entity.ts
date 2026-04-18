import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TimeBlock } from './time-block.entity';
import { Activity } from './activity.entity';

@Entity('activity_group')
export class ActivityGroup {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Geographic area within the park — e.g. "Tomorrowland", "Fantasyland".
   * Used by the scheduler to cluster nearby activities and minimize walking.
   */
  @Column({ type: 'varchar', length: 255 })
  area: string;

  /** Display order within the time block. Lower values appear first. */
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => TimeBlock, (block) => block.groups, { onDelete: 'CASCADE' })
  timeBlock: TimeBlock;

  @OneToMany(() => Activity, (activity) => activity.group, { cascade: true })
  activities: Activity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
