import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, rating, feedback, recommendations, to } = await request.json();

    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Missing email credentials in environment variables');
      return NextResponse.json(
        { error: 'Email configuration is missing' },
        { status: 500 }
      );
    }

    console.log('Creating email transporter...'); // Debug log

    // Create a transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Only use this in development
      }
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('Email transporter verified successfully'); // Debug log
    } catch (error) {
      console.error('Email transporter verification failed:', error);
      return NextResponse.json(
        { error: 'Email service configuration is invalid. Please check your credentials.' },
        { status: 500 }
      );
    }

    console.log('Preparing email content...'); // Debug log

    // Email content
    const mailOptions = {
      from: `"TrustNet Feedback" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `TrustNet Feedback from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333; border-bottom: 2px solid #c6ff20; padding-bottom: 10px;">New Feedback Received</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Rating:</strong> ${'⭐'.repeat(parseInt(rating))}</p>
          <h3 style="color: #333; margin-top: 20px;">Feedback:</h3>
          <p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">${feedback}</p>
          <h3 style="color: #333; margin-top: 20px;">Recommendations:</h3>
          <p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">${recommendations || 'No recommendations provided'}</p>
        </div>
      `,
    };

    console.log('Sending email...'); // Debug log

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info); // Debug log

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending feedback:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send feedback' },
      { status: 500 }
    );
  }
} 