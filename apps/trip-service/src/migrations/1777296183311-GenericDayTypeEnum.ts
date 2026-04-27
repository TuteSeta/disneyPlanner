import { MigrationInterface, QueryRunner } from "typeorm";

export class GenericDayTypeEnum1777296183311 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."trip_day_daytype_enum" ADD VALUE IF NOT EXISTS 'THEME_PARK'`);
        await queryRunner.query(`ALTER TYPE "public"."trip_day_daytype_enum" ADD VALUE IF NOT EXISTS 'SIGHTSEEING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL does not support removing enum values directly.
    }

}
