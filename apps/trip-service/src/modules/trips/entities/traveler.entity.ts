import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from './trip.entity';

@Entity('traveler')
export class Traveler {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  /** Optional age — useful for height-restriction checks and ticket categories. */
  @Column({ type: 'int', nullable: true })
  age: number | null;

  /**
   * Flexible notes field: dietary restrictions, accessibility needs, etc.
   * Future services can parse structured data from here or we can add
   * dedicated columns when the schema stabilises.
   */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Trip, (trip) => trip.travelers, { onDelete: 'CASCADE' })
  trip: Trip;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
