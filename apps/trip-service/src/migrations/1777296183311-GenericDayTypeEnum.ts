import { MigrationInterface, QueryRunner } from "typeorm";

export class GenericDayTypeEnum1777296183311 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "trip_day_daytype_enum_new" AS ENUM('THEME_PARK', 'SHOPPING', 'REST', 'MIXED', 'SIGHTSEEING');
        `);

        await queryRunner.query(`
            ALTER TABLE trip_day 
            ALTER COLUMN "dayType" TYPE "trip_day_daytype_enum_new" 
            USING (
                CASE "dayType"::text
                    WHEN 'DISNEY' THEN 'THEME_PARK'::"trip_day_daytype_enum_new"
                    WHEN 'UNIVERSAL' THEN 'THEME_PARK'::"trip_day_daytype_enum_new"
                    WHEN 'OTHER_PARK' THEN 'THEME_PARK'::"trip_day_daytype_enum_new"
                    WHEN 'SHOPPING' THEN 'SHOPPING'::"trip_day_daytype_enum_new"
                    WHEN 'REST' THEN 'REST'::"trip_day_daytype_enum_new"
                    WHEN 'MIXED' THEN 'MIXED'::"trip_day_daytype_enum_new"
                END
            );
        `);

        await queryRunner.query(`DROP TYPE "trip_day_daytype_enum";`);
        await queryRunner.query(`ALTER TYPE "trip_day_daytype_enum_new" RENAME TO "trip_day_daytype_enum";`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "trip_day_daytype_enum_old" AS ENUM('DISNEY', 'UNIVERSAL', 'OTHER_PARK', 'SHOPPING', 'REST', 'MIXED');
        `);

        await queryRunner.query(`
            ALTER TABLE trip_day 
            ALTER COLUMN "dayType" TYPE "trip_day_daytype_enum_old" 
            USING (
                CASE "dayType"::text
                    WHEN 'THEME_PARK' THEN 'DISNEY'::"trip_day_daytype_enum_old"
                    WHEN 'SHOPPING' THEN 'SHOPPING'::"trip_day_daytype_enum_old"
                    WHEN 'REST' THEN 'REST'::"trip_day_daytype_enum_old"
                    WHEN 'MIXED' THEN 'MIXED'::"trip_day_daytype_enum_old"
                    WHEN 'SIGHTSEEING' THEN 'MIXED'::"trip_day_daytype_enum_old"
                END
            );
        `);

        await queryRunner.query(`DROP TYPE "trip_day_daytype_enum";`);
        await queryRunner.query(`ALTER TYPE "trip_day_daytype_enum_old" RENAME TO "trip_day_daytype_enum";`);
    }

}
