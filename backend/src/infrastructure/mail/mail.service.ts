import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Interface cho mail service — Use Case chỉ phụ thuộc interface, không phụ thuộc thư viện cụ thể.
 */
export interface IMailService {
  sendVerificationEmail(to: string, fullName: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, fullName: string, token: string): Promise<void>;
}

export const MAIL_SERVICE = Symbol('MAIL_SERVICE');

const cleanEnv = (val?: string | null): string => {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

@Injectable()
export class NodemailerMailService implements IMailService {
  private readonly logger = new Logger(NodemailerMailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const rawFrom = cleanEnv(this.configService.get<string>('MAIL_FROM'));
    const smtpUser = cleanEnv(this.configService.get<string>('SMTP_USER'));
    if (rawFrom && rawFrom.includes('@')) {
      this.fromAddress = rawFrom;
    } else if (rawFrom && smtpUser) {
      this.fromAddress = `"${rawFrom}" <${smtpUser}>`;
    } else {
      this.fromAddress = smtpUser ? `"PSYTHALIA" <${smtpUser}>` : 'PSYTHALIA <no-reply@psythalia.local>';
    }
    const rawFrontend =
      cleanEnv(this.configService.get<string>('FRONTEND_URL')) || 'http://localhost:5173';
    this.frontendUrl = rawFrontend.split(',')[0].trim().replace(/\/+$/, '');

    this.initTransporter();
  }

  private initTransporter(): void {
    const service = cleanEnv(this.configService.get<string>('SMTP_SERVICE'));
    const host = cleanEnv(this.configService.get<string>('SMTP_HOST')) || 'smtp.gmail.com';
    const port = Number(cleanEnv(this.configService.get<string>('SMTP_PORT'))) || 587;
    const secure =
      cleanEnv(this.configService.get<string>('SMTP_SECURE')) === 'true' || port === 465;
    const user = cleanEnv(this.configService.get<string>('SMTP_USER'));
    const pass = cleanEnv(this.configService.get<string>('SMTP_PASS'));

    if (!user || !pass) {
      this.logger.warn(
        '⚠️ SMTP_USER hoặc SMTP_PASS chưa được cấu hình trong .env. Nodemailer sẽ không thể gửi email thật. Hãy cập nhật file .env với thông tin tài khoản SMTP (ví dụ Gmail App Password).',
      );
      return;
    }

    try {
      if (service) {
        this.transporter = nodemailer.createTransport({
          service,
          auth: { user, pass },
        });
        this.logger.log(`Nodemailer đã khởi tạo qua service: ${service} (user: ${user})`);
      } else {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        });
        this.logger.log(`Nodemailer đã khởi tạo với host: ${host}:${port} (user: ${user})`);
      }
    } catch (err) {
      this.logger.error('Khởi tạo nodemailer transport thất bại:', err);
    }
  }

  private async dispatchEmail(to: string, subject: string, html: string): Promise<void> {
    const brevoApiKey = cleanEnv(this.configService.get<string>('BREVO_API_KEY'));
    const resendApiKey = cleanEnv(this.configService.get<string>('RESEND_API_KEY'));

    // 1. Ưu tiên Brevo API (HTTPS port 443 — Gửi được tới MỌI email, không bắt buộc verify domain)
    if (brevoApiKey) {
      this.logger.log(`Đang gửi email tới ${to} qua Brevo HTTPS API (port 443)...`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'PSYTHALIA',
            email: cleanEnv(this.configService.get<string>('SMTP_USER')) || 'hongboi1505@gmail.com',
          },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Brevo API error (${res.status}): ${errText}`);
      }
      this.logger.log(`Email đã được gửi thành công đến ${to} qua Brevo HTTPS API.`);
      return;
    }

    // 2. Gửi qua Resend API (HTTPS port 443 — Chế độ test chỉ gửi tới email chủ tài khoản, trừ khi đã add domain)
    if (resendApiKey) {
      this.logger.log(`Đang gửi email tới ${to} qua Resend HTTPS API (port 443)...`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: cleanEnv(this.configService.get<string>('RESEND_FROM')) || 'PSYTHALIA <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Resend API error (${res.status}): ${errText}`);
      }
      this.logger.log(`Email đã được gửi thành công đến ${to} qua Resend HTTPS API.`);
      return;
    }

    // 3. Fallback gửi qua Nodemailer SMTP (chạy trên localhost hoặc server có mở cổng 587/465)
    if (!this.transporter) {
      this.logger.warn(`Chưa cấu hình mail provider hoặc SMTP. Bỏ qua gửi email đến: ${to}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      html,
    });
    this.logger.log(`Email đã được gửi thành công đến: ${to} qua Nodemailer SMTP.`);
  }

  async sendVerificationEmail(to: string, fullName: string, token: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;

    const resendApiKey = cleanEnv(this.configService.get<string>('RESEND_API_KEY'));
    const brevoApiKey = cleanEnv(this.configService.get<string>('BREVO_API_KEY'));

    if (!resendApiKey && !brevoApiKey && !this.transporter) {
      this.logger.warn(
        `[CHƯA CẤU HÌNH MAIL] Bỏ qua gửi email xác nhận đến: ${to}.\nLink xác nhận (dùng để test): ${verifyUrl}`,
      );
      return;
    }

    const html = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #edf2f7; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #6c5ce7; margin-bottom: 8px;">✨ PSYTHALIA</h1>
              <p style="color: #718096; font-size: 14px; margin: 0;">Nền tảng Hỗ trợ Sức khỏe Tinh thần & Sơ cứu Tâm lý</p>
            </div>
            <h2 style="color: #2d3436; font-size: 20px;">Xin chào ${fullName},</h2>
            <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
              Cảm ơn bạn đã đăng ký tài khoản tại PSYTHALIA. Vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản của bạn:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}"
                 style="background: linear-gradient(135deg, #6c5ce7, #a29bfe);
                        color: #ffffff; padding: 14px 36px; border-radius: 8px;
                        text-decoration: none; font-weight: 600; font-size: 16px;
                        display: inline-block; box-shadow: 0 4px 12px rgba(108, 92, 231, 0.25);">
                Xác nhận Email ngay
              </a>
            </div>
            <p style="color: #718096; font-size: 13px; line-height: 1.5;">
              Nếu nút trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:<br/>
              <a href="${verifyUrl}" style="color: #6c5ce7; word-break: break-all;">${verifyUrl}</a>
            </p>
            <p style="color: #a0aec0; font-size: 13px;">
              Liên kết này sẽ hết hạn sau <strong>24 giờ</strong>. Nếu bạn không yêu cầu đăng ký này, vui lòng bỏ qua email.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #a0aec0; font-size: 12px; text-align: center; margin: 0;">
              © 2026 PSYTHALIA — Khóa luận Tốt nghiệp
            </p>
          </div>
        `;

    try {
      await this.dispatchEmail(to, 'Xác nhận tài khoản — PSYTHALIA', html);
    } catch (error) {
      this.logger.error(`Lỗi khi gửi email xác nhận đến ${to}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, fullName: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

    const resendApiKey = cleanEnv(this.configService.get<string>('RESEND_API_KEY'));
    const brevoApiKey = cleanEnv(this.configService.get<string>('BREVO_API_KEY'));

    if (!resendApiKey && !brevoApiKey && !this.transporter) {
      this.logger.warn(
        `[CHƯA CẤU HÌNH MAIL] Bỏ qua gửi email đặt lại mật khẩu đến: ${to}.\nLink đặt lại mật khẩu (dùng để test): ${resetUrl}`,
      );
      return;
    }

    const html = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #edf2f7; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #6c5ce7; margin-bottom: 8px;">✨ PSYTHALIA</h1>
              <p style="color: #718096; font-size: 14px; margin: 0;">Nền tảng Hỗ trợ Sức khỏe Tinh thần & Sơ cứu Tâm lý</p>
            </div>
            <h2 style="color: #2d3436; font-size: 20px;">Xin chào ${fullName},</h2>
            <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại PSYTHALIA. Nhấn vào nút bên dưới để tiến hành tạo mật khẩu mới:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}"
                 style="background: linear-gradient(135deg, #e17055, #fab1a0);
                        color: #ffffff; padding: 14px 36px; border-radius: 8px;
                        text-decoration: none; font-weight: 600; font-size: 16px;
                        display: inline-block; box-shadow: 0 4px 12px rgba(225, 112, 85, 0.25);">
                Đặt lại mật khẩu
              </a>
            </div>
            <p style="color: #718096; font-size: 13px; line-height: 1.5;">
              Nếu nút trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:<br/>
              <a href="${resetUrl}" style="color: #e17055; word-break: break-all;">${resetUrl}</a>
            </p>
            <p style="color: #a0aec0; font-size: 13px;">
              Liên kết này sẽ hết hạn sau <strong>1 giờ</strong>. Nếu bạn không gửi yêu cầu này, hãy yên tâm tài khoản của bạn vẫn an toàn và bỏ qua email này.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #a0aec0; font-size: 12px; text-align: center; margin: 0;">
              © 2026 PSYTHALIA — Khóa luận Tốt nghiệp
            </p>
          </div>
        `;

    try {
      await this.dispatchEmail(to, 'Đặt lại mật khẩu — PSYTHALIA', html);
    } catch (error) {
      this.logger.error(`Lỗi khi gửi email đặt lại mật khẩu đến ${to}:`, error);
      throw error;
    }
  }
}
