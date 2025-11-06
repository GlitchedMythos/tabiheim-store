import { Resend } from 'resend';
import nodemailer from 'nodemailer';

/**
 * Email service that switches between Resend (production) and Mailpit SMTP (local development)
 */

/**
 * Sends a magic link email to the specified recipient
 *
 * @param env - Cloudflare environment bindings
 * @param to - Recipient email address
 * @param url - The magic link URL
 * @param token - The magic link token (for logging/debugging)
 */
export async function sendMagicLinkEmail(
  env: CloudflareBindings,
  to: string,
  url: string,
  token: string
): Promise<void> {
  const isProduction = env.ENVIRONMENT === 'production';

  const subject = 'Sign in to Tabiheim Games';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          <h1 style="color: #333; margin-top: 0;">Sign in to Tabiheim Games</h1>
          <p>Click the button below to sign in to your account. This link will expire in 5 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Sign In</a>
          </div>
          <p style="color: #666; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">Or copy and paste this URL into your browser:<br>
            <span style="word-break: break-all;">${url}</span>
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Sign in to Tabiheim Games\n\nClick the link below to sign in to your account. This link will expire in 5 minutes.\n\n${url}\n\nIf you didn't request this email, you can safely ignore it.`;

  if (isProduction) {
    // Production: Use Resend API
    const resend = new Resend(env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'Tabiheim Games <noreply@tabiheimgames.com>',
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Failed to send email via Resend:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent via Resend:', data?.id);
  } else {
    // Local development: Use Mailpit SMTP
    const transporter = nodemailer.createTransport({
      host: '127.0.0.1', // Use IP address instead of 'localhost' for Wrangler compatibility
      port: 1025,
      secure: false, // Mailpit doesn't use TLS
      tls: {
        rejectUnauthorized: false,
      },
    });

    try {
      const info = await transporter.sendMail({
        from: '"Tabiheim Games" <noreply@tabiheimgames.com>',
        to,
        subject,
        text,
        html,
      });

      console.log('Email sent via Mailpit:', info.messageId);
      console.log('Magic link token:', token);
      console.log('View email at: http://localhost:8025');
    } catch (error) {
      console.error('Failed to send email via Mailpit:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(
        `Failed to send email via Mailpit: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure Docker is running with 'docker-compose up -d'`
      );
    }
  }
}

