import 'dotenv/config';
import nodemailer from 'nodemailer';

type EmailType = 'email-confirmation' | 'password-reset';

const templates: Record<EmailType, (token: string, userName?: string) => { subject: string; html: string }> = {
    'email-confirmation': (token) => ({
        subject: 'Confirmação de Email',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 24px; background: #fafbfc;">
            <h2 style="color: #2d7ff9;">Bem-vindo!</h2>
            <p>Para ativar sua conta, utilize o código abaixo:</p>
            <div style="font-size: 1.5em; font-weight: bold; color: #333; margin: 16px 0;">${token}</div>
            <p style="margin-top: 24px; font-size: 0.9em; color: #888;">Se você não solicitou este cadastro, ignore este email.</p>
        </div>`,
    }),
    'password-reset': (token, userName) => ({
        subject: 'Redefinição de Senha',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 24px; background: #fafbfc;">
            <h2 style="color: #e05c00;">Redefinição de Senha</h2>
            <p>Olá${userName ? `, <strong>${userName}</strong>` : ''}!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo:</p>
            <div style="font-size: 1.5em; font-weight: bold; color: #333; margin: 16px 0; letter-spacing: 4px;">${token}</div>
            <p>Este código expira em <strong>15 minutos</strong>.</p>
            <p style="margin-top: 24px; font-size: 0.9em; color: #888;">Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanece a mesma.</p>
        </div>`,
    }),
};

export class SendTokenFromEmailService {
    async sendToken(email: string, token: string, type: EmailType = 'email-confirmation', userName?: string) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const { subject, html } = templates[type](token, userName);

            const info = await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject,
                text: `Seu código: ${token}`,
                html,
            });

            if (!info || !info.accepted || !Array.isArray(info.accepted) || info.accepted.length === 0) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }
}