import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOtherParkDayType1776551491559 implements MigrationInterface {
    name = 'AddOtherParkDayType1776551491559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."trip_day_daytype_enum" ADD VALUE IF NOT EXISTS 'OTHER_PARK'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL does not support removing enum values directly.
        // To rollback, recreate the type without OTHER_PARK and update the column.
    }
}
