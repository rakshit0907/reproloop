import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPatchesAndVerification1794296016182 implements MigrationInterface {
  name = 'AddPatchesAndVerification1794296016182';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "proposed_patches" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "incidentId" uuid NOT NULL,
                "submittedBy" character varying(120) NOT NULL,
                "patchContent" text NOT NULL,
                "explanation" text,
                "affectedFiles" jsonb NOT NULL,
                "source" character varying(40) NOT NULL DEFAULT 'DEVELOPER_SUBMITTED',
                "status" character varying(20) NOT NULL DEFAULT 'SUBMITTED',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_659a7ae28241162f6f407d8feca" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_a7659b9c985d1e4be15c65d66a" ON "proposed_patches" ("incidentId", "createdAt")
        `);
    await queryRunner.query(`
            CREATE TABLE "verification_runs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "patchId" uuid NOT NULL,
                "status" character varying(20) NOT NULL,
                "reason" text NOT NULL,
                "command" character varying(200) NOT NULL,
                "exitCode" integer,
                "stdout" text NOT NULL,
                "stderr" text NOT NULL,
                "testsRun" integer,
                "testsFailed" integer,
                "durationMs" integer NOT NULL,
                "repository" character varying(200) NOT NULL,
                "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "completedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT "PK_b7dbc4e1be46e62a753e8142b87" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_bf37a4336f73e9f61a7f33f24c" ON "verification_runs" ("patchId", "startedAt")
        `);
    await queryRunner.query(`
            ALTER TABLE "proposed_patches"
            ADD CONSTRAINT "FK_fde1787c4b61efee51e307da509" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "verification_runs"
            ADD CONSTRAINT "FK_7a74454b7b207d6bb2bede2de73" FOREIGN KEY ("patchId") REFERENCES "proposed_patches"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "verification_runs" DROP CONSTRAINT "FK_7a74454b7b207d6bb2bede2de73"
        `);
    await queryRunner.query(`
            ALTER TABLE "proposed_patches" DROP CONSTRAINT "FK_fde1787c4b61efee51e307da509"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_bf37a4336f73e9f61a7f33f24c"
        `);
    await queryRunner.query(`
            DROP TABLE "verification_runs"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_a7659b9c985d1e4be15c65d66a"
        `);
    await queryRunner.query(`
            DROP TABLE "proposed_patches"
        `);
  }
}
