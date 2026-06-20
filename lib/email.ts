import nodemailer from 'nodemailer'

export type EmailNotificationType =
  | 'registration_confirmation'
  | 'seat_confirmed'
  | 'payment_received'
  | 'waitlist_added'
  | 'waitlist_available'
  | 'event_reminder'
  | 'receipt'

export interface EmailData {
  type: EmailNotificationType
  to: string
  name: string
  eventName?: string
  eventDate?: string
  eventTime?: string
  eventVenue?: string
  eventAddress?: string
  selectedPackage?: string
  seatNumbers?: number[]
  receiptNumber?: string
  totalAmount?: number
  currency?: string
  paymentMethod?: string
}

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

function baseTemplate(content: string, eventName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${eventName}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 4px 0;color:#93c5fd;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">HAMINASS</p>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3;">${eventName}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="margin:0 0 4px 0;color:#64748b;font-size:13px;">Questions? Contact us at <a href="mailto:${process.env.GMAIL_USER}" style="color:#1d4ed8;text-decoration:none;">${process.env.GMAIL_USER}</a></p>
            <p style="margin:0;color:#94a3b8;font-size:12px;">HAMINASS &bull; Empowering East African Business Leaders</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 16px;background:#f8fafc;border-radius:6px;margin-bottom:6px;">
      <span style="color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${label}</span><br/>
      <span style="color:#1e293b;font-size:15px;font-weight:500;">${value}</span>
    </td>
  </tr>`
}

function buildHTML(data: EmailData): string {
  const event = data.eventName || 'Executive Masterclass'
  const currency = data.currency || 'USD'

  switch (data.type) {
    case 'registration_confirmation': {
      const content = `
        <h2 style="margin:0 0 8px 0;color:#1e293b;font-size:22px;">Registration Received!</h2>
        <p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6;">
          Dear <strong>${data.name}</strong>, we have received your registration for <strong>${event}</strong>.
          Your application is currently under review. You will receive a confirmation once your payment is verified.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 6px;">
          ${data.selectedPackage ? infoRow('Package', data.selectedPackage) : ''}
          ${data.totalAmount ? infoRow('Amount Due', `${currency} ${data.totalAmount.toLocaleString()}`) : ''}
          ${data.paymentMethod ? infoRow('Payment Method', data.paymentMethod) : ''}
          ${data.receiptNumber ? infoRow('Reference No.', data.receiptNumber) : ''}
        </table>

        <div style="margin:28px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;">
          <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">
            <strong>Next Step:</strong> Our team will review your registration and payment within 1–2 business days.
            You will receive an email confirmation with your seat details once approved.
          </p>
        </div>

        ${data.eventDate ? `
        <div style="margin:20px 0;padding:20px;border:1px solid #e2e8f0;border-radius:8px;">
          <p style="margin:0 0 12px 0;color:#1e293b;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Event Details</p>
          ${data.eventDate ? `<p style="margin:0 0 4px 0;color:#475569;font-size:14px;">📅 ${data.eventDate}${data.eventTime ? ' at ' + data.eventTime : ''}</p>` : ''}
          ${data.eventVenue ? `<p style="margin:0 0 4px 0;color:#475569;font-size:14px;">📍 ${data.eventVenue}${data.eventAddress ? ', ' + data.eventAddress : ''}</p>` : ''}
        </div>` : ''}

        <p style="margin:24px 0 0 0;color:#475569;font-size:14px;">Thank you for registering. We look forward to seeing you!</p>
      `
      return baseTemplate(content, event)
    }

    case 'seat_confirmed': {
      const seats = data.seatNumbers && data.seatNumbers.length > 0
        ? data.seatNumbers.join(', ')
        : 'To be assigned'
      const content = `
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;">✅</div>
          <h2 style="margin:12px 0 4px 0;color:#1e293b;font-size:22px;">Your Seat is Confirmed!</h2>
          <p style="margin:0;color:#64748b;font-size:15px;">Your payment has been approved</p>
        </div>

        <p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6;">
          Dear <strong>${data.name}</strong>, great news! Your registration for <strong>${event}</strong> has been confirmed.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 6px;">
          ${data.receiptNumber ? infoRow('Receipt No.', data.receiptNumber) : ''}
          ${data.selectedPackage ? infoRow('Package', data.selectedPackage) : ''}
          ${infoRow('Seat Number(s)', seats)}
          ${data.totalAmount ? infoRow('Amount Paid', `${currency} ${data.totalAmount.toLocaleString()}`) : ''}
        </table>

        ${data.eventDate ? `
        <div style="margin:24px 0;padding:20px;border:2px solid #1d4ed8;border-radius:8px;">
          <p style="margin:0 0 12px 0;color:#1e293b;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Event Details — Save the Date</p>
          ${data.eventDate ? `<p style="margin:0 0 4px 0;color:#475569;font-size:14px;">📅 <strong>${data.eventDate}</strong>${data.eventTime ? ' at ' + data.eventTime : ''}</p>` : ''}
          ${data.eventVenue ? `<p style="margin:0 0 4px 0;color:#475569;font-size:14px;">📍 <strong>${data.eventVenue}</strong>${data.eventAddress ? ', ' + data.eventAddress : ''}</p>` : ''}
        </div>` : ''}

        <div style="margin:20px 0;padding:16px;background:#eff6ff;border-left:4px solid #1d4ed8;border-radius:0 6px 6px 0;">
          <p style="margin:0;color:#1e3a8a;font-size:14px;line-height:1.6;">
            Please bring a valid ID and this confirmation email on the event day. We look forward to welcoming you!
          </p>
        </div>
      `
      return baseTemplate(content, event)
    }

    case 'payment_received': {
      const content = `
        <h2 style="margin:0 0 8px 0;color:#1e293b;font-size:22px;">Payment Received</h2>
        <p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6;">
          Dear <strong>${data.name}</strong>, we have received your payment for <strong>${event}</strong>.
          Our team is reviewing your submission and will confirm your seat shortly.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 6px;">
          ${data.receiptNumber ? infoRow('Reference No.', data.receiptNumber) : ''}
          ${data.selectedPackage ? infoRow('Package', data.selectedPackage) : ''}
          ${data.totalAmount ? infoRow('Amount', `${currency} ${data.totalAmount.toLocaleString()}`) : ''}
          ${data.paymentMethod ? infoRow('Payment Method', data.paymentMethod) : ''}
        </table>

        <p style="margin:24px 0 0 0;color:#475569;font-size:14px;">You will receive another email once your seat is confirmed.</p>
      `
      return baseTemplate(content, event)
    }

    case 'waitlist_added': {
      const content = `
        <h2 style="margin:0 0 8px 0;color:#1e293b;font-size:22px;">You're on the Waitlist</h2>
        <p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6;">
          Dear <strong>${data.name}</strong>, thank you for your interest in <strong>${event}</strong>.
          Unfortunately all seats are currently filled, but we have added you to our waitlist.
        </p>

        <div style="margin:20px 0;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;">
          <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">
            We will contact you immediately if a seat becomes available. Waitlist positions are filled on a first-come, first-served basis.
          </p>
        </div>

        ${data.selectedPackage ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 6px;">
          ${infoRow('Requested Package', data.selectedPackage)}
        </table>` : ''}
      `
      return baseTemplate(content, event)
    }

    case 'waitlist_available': {
      const content = `
        <div style="text-align:center;margin-bottom:28px;">
          <div style="display:inline-block;background:#fef3c7;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;">🎉</div>
          <h2 style="margin:12px 0 4px 0;color:#1e293b;font-size:22px;">A Seat is Available!</h2>
          <p style="margin:0;color:#64748b;font-size:15px;">Your waitlist position has been reached</p>
        </div>

        <p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6;">
          Dear <strong>${data.name}</strong>, great news! A seat for <strong>${event}</strong> is now available for you.
          Please contact us immediately to confirm your registration before the seat is offered to the next person on the waitlist.
        </p>

        <div style="text-align:center;margin:28px 0;">
          <a href="mailto:${process.env.GMAIL_USER}" style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
            Confirm Your Seat Now
          </a>
        </div>

        <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">This offer is time-sensitive. Please respond within 24 hours.</p>
      `
      return baseTemplate(content, event)
    }

    default:
      return baseTemplate(`<p style="color:#475569;">Hello ${data.name}, you have a notification regarding ${event}.</p>`, event)
  }
}

export async function sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    console.error('[email] GMAIL_USER or GMAIL_APP_PASSWORD not set')
    return { success: false, error: 'Email credentials not configured' }
  }

  const subjects: Record<EmailNotificationType, string> = {
    registration_confirmation: `Registration Received — ${data.eventName || 'Executive Masterclass'}`,
    seat_confirmed: `Your Seat is Confirmed — ${data.eventName || 'Executive Masterclass'}`,
    payment_received: `Payment Received — ${data.eventName || 'Executive Masterclass'}`,
    waitlist_added: `Added to Waitlist — ${data.eventName || 'Executive Masterclass'}`,
    waitlist_available: `Seat Available for You! — ${data.eventName || 'Executive Masterclass'}`,
    event_reminder: `Event Reminder — ${data.eventName || 'Executive Masterclass'}`,
    receipt: `Payment Receipt — ${data.eventName || 'Executive Masterclass'}`,
  }

  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from: `"${data.eventName || 'HAMINASS Executive Masterclass'}" <${user}>`,
      to: data.to,
      subject: subjects[data.type],
      html: buildHTML(data),
    })
    return { success: true }
  } catch (err) {
    console.error('[email] Send failed:', err)
    return { success: false, error: String(err) }
  }
}
