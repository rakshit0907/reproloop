import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIncidentEvents1794214208009 implements MigrationInterface {
  name = 'AddIncidentEvents1794214208009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "incident_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "incidentId" uuid NOT NULL,
                "eventType" character varying(60) NOT NULL,
                "previousStatus" character varying(40),
                "newStatus" character varying(40),
                "actor" character varying(120) NOT NULL,
                "description" text NOT NULL,
                "metadata" jsonb,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_1230e0a50df3503eed115634297" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_f5fad9e73bfcbf096a029e62cd" ON "incident_events" ("incidentId", "createdAt")
        `);
    await queryRunner.query(`
            ALTER TABLE "incident_events"
            ADD CONSTRAINT "FK_3aa9fb9ea475af8d1e4b571adfd" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "incident_events" DROP CONSTRAINT "FK_3aa9fb9ea475af8d1e4b571adfd"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_f5fad9e73bfcbf096a029e62cd"
        `);
    await queryRunner.query(`
            DROP TABLE "incident_events"
        `);
  }
}
