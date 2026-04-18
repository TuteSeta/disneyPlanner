import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776545610420 implements MigrationInterface {
    name = 'Migration1776545610420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trip_day" ADD "passRecommendation" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trip_day" DROP COLUMN "passRecommendation"`);
    }

}
