import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1794073701555 implements MigrationInterface {
  name = 'InitialSchema1794073701555';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
            
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(120) NOT NULL,
                "email" character varying(255) NOT NULL,
                "passwordHash" character varying(255) NOT NULL,
                "role" character varying(20) NOT NULL DEFAULT 'REPORTER',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "projects" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(160) NOT NULL,
                "description" text,
                "repositoryUrl" character varying(500),
                "ownerId" uuid NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "incidents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "projectId" uuid NOT NULL,
                "reporterId" uuid NOT NULL,
                "title" character varying(200) NOT NULL,
                "description" text NOT NULL,
                "expectedBehavior" text,
                "actualBehavior" text,
                "reproductionSteps" text,
                "category" character varying(40),
                "severity" character varying(20),
                "status" character varying(40) NOT NULL DEFAULT 'RECEIVED',
                "diagnosticsConsent" boolean NOT NULL DEFAULT false,
                "diagnosticsConsentAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ccb34c01719889017e2246469f9" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_eb4eedb4f8cf4e58b66857067f" ON "incidents" ("reporterId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_ed5c5c5b7a6f829e686aaf31be" ON "incidents" ("projectId", "status")
        `);
    await queryRunner.query(`
            ALTER TABLE "projects"
            ADD CONSTRAINT "FK_a8e7e6c3f9d9528ed35fe5bae33" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "incidents"
            ADD CONSTRAINT "FK_b59253407df1320b7abadc3d4dd" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "incidents"
            ADD CONSTRAINT "FK_eb4eedb4f8cf4e58b66857067f9" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "incidents" DROP CONSTRAINT "FK_eb4eedb4f8cf4e58b66857067f9"
        `);
    await queryRunner.query(`
            ALTER TABLE "incidents" DROP CONSTRAINT "FK_b59253407df1320b7abadc3d4dd"
        `);
    await queryRunner.query(`
            ALTER TABLE "projects" DROP CONSTRAINT "FK_a8e7e6c3f9d9528ed35fe5bae33"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_ed5c5c5b7a6f829e686aaf31be"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_eb4eedb4f8cf4e58b66857067f"
        `);
    await queryRunner.query(`
            DROP TABLE "incidents"
        `);
    await queryRunner.query(`
            DROP TABLE "projects"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
  }
}
