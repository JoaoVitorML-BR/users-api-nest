import 'dotenv/config';
import nodemailer from 'nodemailer';

export class SendTokenFromEmailService {
    async sendToken(email: string, token: string) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Confirmação de Email',
                text: `Seu código de confirmação: ${token}`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 24px; background: #fafbfc;">
                    <h2 style="color: #2d7ff9;">Bem-vindo!</h2>
                    <p>Para ativar sua conta, utilize o código abaixo:</p>
                    <div style="font-size: 1.5em; font-weight: bold; color: #333; margin: 16px 0;">${token}</div>
                    <p>Ou clique no botão abaixo:</p>
                    <a href="https://seusite.com/confirmar-email?token=${token}" style="display: inline-block; padding: 10px 20px; background: #2d7ff9; color: #fff; border-radius: 4px; text-decoration: none; font-weight: bold;">Confirmar Email</a>
                    <p style="margin-top: 24px; font-size: 0.9em; color: #888;">Se você não solicitou este cadastro, ignore este email.</p>
                </div>
            `,
            };

            const info = await transporter.sendMail(mailOptions);
            if (!info || !info.accepted || !Array.isArray(info.accepted) || info.accepted.length === 0) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }
}