import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { TripDay } from './trip-day.entity';
import { ActivityGroup } from './activity-group.entity';
import { TimeBlockType } from '../enums/time-block-type.enum';

@Entity('time_block')
export class TimeBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TimeBlockType })
  type: TimeBlockType;

  /** HH:MM — e.g. "09:00" */
  @Column({ type: 'varchar', length: 5 })
  startTime: string;

  /** HH:MM — e.g. "12:00" */
  @Column({ type: 'varchar', length: 5 })
  endTime: string;

  @ManyToOne(() => TripDay, (day) => day.timeBlocks, { onDelete: 'CASCADE' })
  tripDay: Relation<TripDay>;

  @OneToMany(() => ActivityGroup, (group) => group.timeBlock, { cascade: true })
  groups: ActivityGroup[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
