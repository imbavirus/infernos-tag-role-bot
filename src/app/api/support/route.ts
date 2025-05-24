/**
 * @file route.ts
 * @description API route handler for support form submissions
 * @module app/api/support/route
 */

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Interface for the support form data
 * @interface SupportFormData
 */
interface SupportFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * HTML template for the confirmation email
 * @param {string} name - The user's name
 * @returns {string} HTML email template
 */
const getConfirmationEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request Received</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background: linear-gradient(135deg, #65a30d 0%, #4d7c0f 100%);
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .logo {
      max-width: 200px;
      height: auto;
    }
    h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
    }
    p {
      margin: 0 0 20px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Support Request Received</h1>
    </div>
    <div class="content">
      <p>Dear ${name},</p>
      <p>Thank you for contacting our support team. We have received your message and will get back to you as soon as possible.</p>
      <p>We typically respond to support requests within 24-48 hours.</p>
      <p>If you have any additional information to add to your request, please reply to this email.</p>
      <div class="footer">
        <p>Best regards,<br>The Infernos Tag Role Bot Team</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/**
 * POST handler for support form submissions
 * Validates form data and sends an email using configured SMTP settings
 * 
 * @param {Request} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 * 
 * @example
 * // Request body
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "subject": "Help needed",
 *   "message": "I need assistance with..."
 * }
 */
export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json() as SupportFormData;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate SMTP configuration
    const requiredEnvVars = [
      'NEXT_PUBLIC_SMTP_HOST',
      'NEXT_PUBLIC_SMTP_PORT',
      'NEXT_PUBLIC_SMTP_USER',
      'NEXT_PUBLIC_SMTP_PASSWORD',
      'NEXT_PUBLIC_SMTP_FROM',
      'NEXT_PUBLIC_SUPPORT_EMAIL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('Missing required SMTP environment variables:', missingVars);
      return NextResponse.json(
        { error: 'Email configuration is incomplete' },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.NEXT_PUBLIC_SMTP_HOST,
      port: Number(process.env.NEXT_PUBLIC_SMTP_PORT),
      secure: process.env.NEXT_PUBLIC_SMTP_SECURE === 'true',
      auth: {
        user: process.env.NEXT_PUBLIC_SMTP_USER,
        pass: process.env.NEXT_PUBLIC_SMTP_PASSWORD,
      },
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
    } catch (error: any) {
      console.error('SMTP connection verification failed:', error);
      if (error.code === 'EAUTH') {
        return NextResponse.json(
          { error: 'SMTP authentication failed. Please check your email credentials.' },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to connect to SMTP server. Please check your email configuration.' },
        { status: 500 }
      );
    }

    // Send support request to support email
    const supportMailOptions = {
      from: process.env.NEXT_PUBLIC_SMTP_FROM,
      to: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
      subject: `Support Request: ${subject}`,
      text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `,
      html: `
<h2>New Support Request</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<h3>Message:</h3>
<p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };

    // Send confirmation email to user
    const confirmationMailOptions = {
      from: process.env.NEXT_PUBLIC_SMTP_FROM,
      to: email,
      subject: 'Support Request Received - Infernos Tag Role Bot',
      html: getConfirmationEmailTemplate(name),
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(supportMailOptions),
      transporter.sendMail(confirmationMailOptions)
    ]);

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // Provide more specific error messages based on the error type
    if (error.code === 'EAUTH') {
      return NextResponse.json(
        { error: 'Email authentication failed. Please check your email credentials.' },
        { status: 500 }
      );
    }
    
    if (error.code === 'ESOCKET') {
      return NextResponse.json(
        { error: 'Could not connect to email server. Please check your SMTP settings.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send email. Please try again later.' },
      { status: 500 }
    );
  }
} 