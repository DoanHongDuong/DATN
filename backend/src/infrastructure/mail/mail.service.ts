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

@Injectable()
export class NodemailerMailService implements IMailService {
  private readonly logger = new Logger(NodemailerMailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const rawFrom = this.configService.get<string>('MAIL_FROM');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    if (rawFrom && rawFrom.includes('@')) {
      this.fromAddress = rawFrom;
    } else if (rawFrom && smtpUser) {
      this.fromAddress = `"${rawFrom}" <${smtpUser}>`;
    } else {
      this.fromAddress = smtpUser ? `<${smtpUser}>` : 'Mental Health Support <no-reply@mentalhealth.local>';
    }
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';


    this.initTransporter();
  }

  private initTransporter(): void {
    const service = this.configService.get<string>('SMTP_SERVICE');
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = Number(this.configService.get<number>('SMTP_PORT')) || 587;
    const secure =
      this.configService.get<string>('SMTP_SECURE') === 'true' || port === 465;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

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

  async sendVerificationEmail(to: string, fullName: string, token: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;

    if (!this.transporter) {
      this.logger.warn(
        `[CHƯA CẤU HÌNH SMTP] Bỏ qua gửi email xác nhận đến: ${to}.\nLink xác nhận (dùng để test): ${verifyUrl}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: 'Xác nhận tài khoản — Mental Health Support',
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #edf2f7; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #6c5ce7; margin-bottom: 8px;">🧠 Mental Health Support</h1>
              <p style="color: #718096; font-size: 14px; margin: 0;">Hệ thống Hỗ trợ Sức khỏe Tâm thần Học đường</p>
            </div>
            <h2 style="color: #2d3436; font-size: 20px;">Xin chào ${fullName},</h2>
            <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
              Cảm ơn bạn đã đăng ký tài khoản tại Mental Health Support. Vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản của bạn:
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
              © Mental Health Support System — Khóa luận Tốt nghiệp 2026
            </p>
          </div>
        `,
      });
      this.logger.log(`Email xác nhận đã được gửi thành công đến: ${to}`);
    } catch (error) {
      this.logger.error(`Lỗi khi gửi email xác nhận đến ${to}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, fullName: string, token: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

    if (!this.transporter) {
      this.logger.warn(
        `[CHƯA CẤU HÌNH SMTP] Bỏ qua gửi email đặt lại mật khẩu đến: ${to}.\nLink đặt lại mật khẩu (dùng để test): ${resetUrl}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject: 'Đặt lại mật khẩu — Mental Health Support',
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #edf2f7; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #6c5ce7; margin-bottom: 8px;">🧠 Mental Health Support</h1>
              <p style="color: #718096; font-size: 14px; margin: 0;">Hệ thống Hỗ trợ Sức khỏe Tâm thần Học đường</p>
            </div>
            <h2 style="color: #2d3436; font-size: 20px;">Xin chào ${fullName},</h2>
            <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tiến hành tạo mật khẩu mới:
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
              © Mental Health Support System — Khóa luận Tốt nghiệp 2026
            </p>
          </div>
        `,
      });
      this.logger.log(`Email đặt lại mật khẩu đã được gửi thành công đến: ${to}`);
    } catch (error) {
      this.logger.error(`Lỗi khi gửi email đặt lại mật khẩu đến ${to}:`, error);
      throw error;
    }
  }
}
