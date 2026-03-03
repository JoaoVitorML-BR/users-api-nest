import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user.entity";

@Entity('email_confirmations')
export class EmailConfirmation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unique: true })
    userId: string;

    @ManyToOne(() => User, (user) => user.emailConfirmation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'varchar', length: 255 })
    token: string;

    @Column({ type: 'timestamp' })
    expiresAt: Date;
    
    @CreateDateColumn()
    createdAt: Date;
}