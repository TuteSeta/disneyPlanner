import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776453353176 implements MigrationInterface {
    name = 'Migration1776453353176'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."activity_activitytype_enum" AS ENUM('RIDE', 'SHOW', 'FOOD', 'SHOPPING', 'EXPERIENCE')`);
        await queryRunner.query(`CREATE TABLE "activity" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "activityType" "public"."activity_activitytype_enum" NOT NULL, "startTime" character varying(5), "endTime" character varying(5), "sortOrder" integer NOT NULL DEFAULT '0', "priority" integer NOT NULL DEFAULT '5', "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "groupId" integer, CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "activity_group" ("id" SERIAL NOT NULL, "area" character varying(255) NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "timeBlockId" integer, CONSTRAINT "PK_747139e8e5ba564d0edc7652f77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."time_block_type_enum" AS ENUM('morning', 'midday', 'afternoon', 'evening')`);
        await queryRunner.query(`CREATE TABLE "time_block" ("id" SERIAL NOT NULL, "type" "public"."time_block_type_enum" NOT NULL, "startTime" character varying(5) NOT NULL, "endTime" character varying(5) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "tripDayId" integer, CONSTRAINT "PK_1c6bb03fe5b1501673a5d9acb18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."trip_day_daytype_enum" AS ENUM('DISNEY', 'UNIVERSAL', 'SHOPPING', 'REST', 'MIXED')`);
        await queryRunner.query(`CREATE TABLE "trip_day" ("id" SERIAL NOT NULL, "dayNumber" integer NOT NULL, "date" date NOT NULL, "dayType" "public"."trip_day_daytype_enum" NOT NULL DEFAULT 'MIXED', "locationLabel" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "tripId" integer, CONSTRAINT "PK_22c09bc2360526eb49095589b59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "traveler" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "age" integer, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "tripId" integer, CONSTRAINT "PK_17be9195f4528e39046d352f3c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "trip" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_714c23d558208081dbccb9d9268" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_c92541ec3569352e795cc15a2bd" FOREIGN KEY ("groupId") REFERENCES "activity_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_group" ADD CONSTRAINT "FK_80d61efe437194d78d98b0f2c46" FOREIGN KEY ("timeBlockId") REFERENCES "time_block"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_block" ADD CONSTRAINT "FK_27d72d1d2af23c29ac26028c05a" FOREIGN KEY ("tripDayId") REFERENCES "trip_day"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trip_day" ADD CONSTRAINT "FK_05d58a8db071da8935693f43f50" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "traveler" ADD CONSTRAINT "FK_af8243aa19d228c1c64df748df5" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "traveler" DROP CONSTRAINT "FK_af8243aa19d228c1c64df748df5"`);
        await queryRunner.query(`ALTER TABLE "trip_day" DROP CONSTRAINT "FK_05d58a8db071da8935693f43f50"`);
        await queryRunner.query(`ALTER TABLE "time_block" DROP CONSTRAINT "FK_27d72d1d2af23c29ac26028c05a"`);
        await queryRunner.query(`ALTER TABLE "activity_group" DROP CONSTRAINT "FK_80d61efe437194d78d98b0f2c46"`);
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_c92541ec3569352e795cc15a2bd"`);
        await queryRunner.query(`DROP TABLE "trip"`);
        await queryRunner.query(`DROP TABLE "traveler"`);
        await queryRunner.query(`DROP TABLE "trip_day"`);
        await queryRunner.query(`DROP TYPE "public"."trip_day_daytype_enum"`);
        await queryRunner.query(`DROP TABLE "time_block"`);
        await queryRunner.query(`DROP TYPE "public"."time_block_type_enum"`);
        await queryRunner.query(`DROP TABLE "activity_group"`);
        await queryRunner.query(`DROP TABLE "activity"`);
        await queryRunner.query(`DROP TYPE "public"."activity_activitytype_enum"`);
    }

}
