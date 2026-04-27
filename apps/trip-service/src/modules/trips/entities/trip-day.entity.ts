import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from './trip.entity';
import { TimeBlock } from './time-block.entity';
import { DayType } from '../enums/day-type.enum';

@Entity('trip_day')
export class TripDay {
  @PrimaryGeneratedColumn()
  id: number;

  /** 1-based sequential number within the trip */
  @Column()
  dayNumber: number;

  /** ISO date string (YYYY-MM-DD) */
  @Column({ type: 'date' })
  date: string;

  /**
   * Broad classification of the day's focus.
   * Kept generic — not tied to a specific park.
   */
  @Column({
    type: 'enum',
    enum: DayType,
    default: DayType.MIXED,
  })
  dayType: DayType;

  /**
   * Human-readable label for the day's location or theme.
   * Examples: "Magic Kingdom", "Rest Day", "City Tour"
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  locationLabel: string | null;

  /**
   * Recommendation for premium passes.
   * Null if not applicable or not recommended.
   */
  @Column({ type: 'text', nullable: true })
  passRecommendation: string | null;

  @ManyToOne(() => Trip, (trip) => trip.days, { onDelete: 'CASCADE' })
  trip: Trip;

  @OneToMany(() => TimeBlock, (block) => block.tripDay, { cascade: true })
  timeBlocks: TimeBlock[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}