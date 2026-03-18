import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableForeignKey,
} from 'typeorm';

export class InitAuthSchema20260318223000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'users',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                    },
                    {
                        name: 'username',
                        type: 'varchar',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'emailConfirmed',
                        type: 'tinyint',
                        width: 1,
                        default: 0,
                    },
                    {
                        name: 'password',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'role',
                        type: 'enum',
                        enum: ['admin_master', 'admin', 'user'],
                        default: "'user'",
                    },
                    {
                        name: 'refreshToken',
                        type: 'varchar',
                        length: '1024',
                        isNullable: true,
                    },
                    {
                        name: 'isActive',
                        type: 'tinyint',
                        width: 1,
                        default: 0,
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updatedAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: 'email_confirmations',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                    },
                    {
                        name: 'userId',
                        type: 'varchar',
                        length: '36',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'token',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'expiresAt',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'email_confirmations',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
                name: 'FK_email_confirmations_userId_users_id',
            }),
        );

        await queryRunner.createTable(
            new Table({
                name: 'reset_password_tokens',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                    },
                    {
                        name: 'userId',
                        type: 'varchar',
                        length: '36',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'token',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'expiresAt',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'reset_password_tokens',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
                name: 'FK_reset_password_tokens_userId_users_id',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey(
            'reset_password_tokens',
            'FK_reset_password_tokens_userId_users_id',
        );
        await queryRunner.dropTable('reset_password_tokens');

        await queryRunner.dropForeignKey(
            'email_confirmations',
            'FK_email_confirmations_userId_users_id',
        );
        await queryRunner.dropTable('email_confirmations');

        await queryRunner.dropTable('users');
    }
}
