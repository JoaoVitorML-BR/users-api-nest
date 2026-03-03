import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
} from 'typeorm';
import { EmailConfirmation } from './email-confirmation/email-confirmation.entity';

export enum ROLE {
    ADMIN_MASTER = 'admin_master',
    ADMIN = 'admin',
    USER = 'user',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ unique: true })
    username: string;

    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'boolean', default: false })
    emailConfirmed: boolean;

    @Column({ type: 'varchar' })
    password: string;

    @Column({ type: 'enum', enum: ROLE, default: ROLE.USER })
    role: ROLE;

    @Column({ type: 'varchar', length: 1024, nullable: true })
    refreshToken: string | null;

    @Column({ type: 'boolean', default: false })
    isActive: boolean;

    @OneToOne(() => EmailConfirmation, (ec) => ec.user, {
        nullable: true,
        cascade: true
    })
    emailConfirmation: EmailConfirmation | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}