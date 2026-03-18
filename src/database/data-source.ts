import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { EmailConfirmation } from '../modules/users/email-confirmation/email-confirmation.entity';
import { ResetPasswordToken } from '../modules/auth/password-reset/password-reset.entity';

export default new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User, EmailConfirmation, ResetPasswordToken],
    migrations: ['src/database/migrations/*.ts'],
    synchronize: false,
    logging: true,
});
