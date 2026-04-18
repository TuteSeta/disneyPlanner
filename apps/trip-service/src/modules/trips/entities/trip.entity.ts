import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TripDay } from './trip-day.entity';
import { Traveler } from './traveler.entity';

@Entity('trip')
export class Trip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  /** Optional free-form description or trip notes. */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => TripDay, (day) => day.trip, { cascade: true })
  days: TripDay[];

  @OneToMany(() => Traveler, (traveler) => traveler.trip, { cascade: true })
  travelers: Traveler[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}