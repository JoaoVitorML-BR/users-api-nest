import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTwoFactorToUsers20260319100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'isTwoFactorEnabled',
        type: 'tinyint',
        width: 1,
        default: 0,
      }),
      new TableColumn({
        name: 'twoFactorSecret',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'twoFactorSecret');
    await queryRunner.dropColumn('users', 'isTwoFactorEnabled');
  }
}
