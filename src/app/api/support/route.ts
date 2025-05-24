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

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.SUPPORT_EMAIL,
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

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 