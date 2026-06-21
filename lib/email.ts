import nodemailer from 'nodemailer'

export type EmailNotificationType =
  | 'registration_confirmation'
  | 'seat_confirmed'
  | 'payment_received'
  | 'payment_declined'
  | 'waitlist_added'
  | 'waitlist_available'
  | 'event_reminder'
  | 'receipt'
  | 'sponsorship_submitted'
  | 'sponsorship_approved'

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
  // Login credentials — sent with seat_confirmed email
  loginEmail?: string
  loginPassword?: string
  loginUrl?: string
  // Decline reason
  declineReason?: string
}

function createTransporter() {
  // Strip spaces — Google shows App Passwords with spaces but SMTP needs them removed
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s/g, '')
  // Port 587 + STARTTLS works on VPS hosts that block port 465 (SSL)
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass,
    },
  })
}

/* ─────────────────────────────────────────────
   BASE LAYOUT
───────────────────────────────────────────── */
function baseTemplate(content: string, eventName: string, accentColor = '#1d4ed8'): string {
  const supportEmail = process.env.GMAIL_USER || ''
  const siteUrl = process.env.SITE_URL || 'https://e-masterclass.eopsprimax.com'
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${eventName}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;-webkit-font-smoothing:antialiased;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Pre-header spacer -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${eventName} — Official Notification
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Email card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

          <!-- ══ HEADER ══ -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2460 0%,${accentColor} 100%);padding:0;">
              <!-- Top accent bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6);"></td>
                </tr>
              </table>
              <!-- Logo / Brand row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:28px 36px 24px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <img src="${siteUrl}/images/haminass-logo.png" alt="HAMINASS" style="display:block;height:54px;width:auto;object-fit:contain;max-width:210px;margin-bottom:8px;" />
                          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.35;letter-spacing:-0.3px;">${eventName}</h1>
                        </td>
                        <td align="right" valign="middle">
                          <!-- Decorative circle badge -->
                          <div style="display:inline-block;width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.12);line-height:48px;text-align:center;font-size:22px;">&#127891;</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ BODY ══ -->
          <tr>
            <td style="padding:36px 36px 28px 36px;">
              ${content}
            </td>
          </tr>

          <!-- ══ DIVIDER ══ -->
          <tr>
            <td style="padding:0 36px;">
              <hr style="border:none;border-top:1px solid #e8ecf2;margin:0;" />
            </td>
          </tr>

          <!-- ══ FOOTER ══ -->
          <tr>
            <td style="padding:24px 36px 28px 36px;text-align:center;">
              <p style="margin:0 0 6px 0;color:#64748b;font-size:13px;line-height:1.5;">
                Questions? Email us at
                <a href="mailto:${supportEmail}" style="color:${accentColor};text-decoration:none;font-weight:600;">${supportEmail}</a>
              </p>
              <p style="margin:0 0 12px 0;color:#94a3b8;font-size:12px;line-height:1.5;">
                HAMINASS GROUP &mdash; Empowering East African Business Leaders
              </p>
              <!-- Social / unsubscribe row -->
              <p style="margin:0;color:#cbd5e1;font-size:11px;">
                You received this email because you registered for ${eventName}.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email card -->

        <!-- Below-card note -->
        <p style="margin:16px 0 0 0;color:#94a3b8;font-size:11px;text-align:center;">
          &copy; ${new Date().getFullYear()} HAMINASS GROUP. All rights reserved.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>`
}

/* ─────────────────────────────────────────────
   REUSABLE COMPONENTS
───────────────────────────────────────────── */
function detailCard(rows: Array<{ label: string; value: string }>): string {
  const rowsHtml = rows.map(({ label, value }) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;width:38%;">
              ${label}
            </td>
            <td style="color:#1e293b;font-size:14px;font-weight:500;text-align:right;">
              ${value}
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:20px 0;">
      ${rowsHtml}
    </table>`
}

function alertBox(text: string, variant: 'info' | 'warning' | 'success' | 'error'): string {
  const cfg = {
    info:    { bg: '#eff6ff', border: '#3b82f6', color: '#1e40af', icon: 'ℹ️' },
    warning: { bg: '#fffbeb', border: '#f59e0b', color: '#92400e', icon: '⚠️' },
    success: { bg: '#f0fdf4', border: '#22c55e', color: '#14532d', icon: '✅' },
    error:   { bg: '#fef2f2', border: '#ef4444', color: '#991b1b', icon: '🚫' },
  }[variant]
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:${cfg.bg};border-left:4px solid ${cfg.border};border-radius:0 8px 8px 0;margin:20px 0;">
      <tr>
        <td style="padding:14px 16px;">
          <p style="margin:0;color:${cfg.color};font-size:14px;line-height:1.6;">${text}</p>
        </td>
      </tr>
    </table>`
}

function ctaButton(label: string, href: string, color = '#1d4ed8'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
      <tr>
        <td align="center" style="border-radius:8px;background:${color};">
          <a href="${href}"
            style="display:inline-block;padding:13px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.2px;border-radius:8px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`
}

function sectionTitle(text: string): string {
  return `<p style="margin:24px 0 10px 0;color:#0f172a;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${text}</p>`
}

function greetingBlock(name: string, headline: string, sub: string): string {
  return `
    <h2 style="margin:0 0 6px 0;color:#0f172a;font-size:24px;font-weight:700;line-height:1.3;">${headline}</h2>
    <p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;">
      Dear <strong style="color:#1e293b;">${name}</strong>, ${sub}
    </p>`
}

/* ─────────────────────────────────────────────
   EMAIL TEMPLATES
───────────────────────────────────────────── */
function buildHTML(data: EmailData): string {
  const event = data.eventName || 'Executive Masterclass'
  const currency = data.currency || 'USD'
  const supportEmail = process.env.GMAIL_USER || ''

  switch (data.type) {

    /* ── REGISTRATION CONFIRMATION ── */
    case 'registration_confirmation': {
      const detailRows = [
        ...(data.selectedPackage ? [{ label: 'Package', value: data.selectedPackage }] : []),
        ...(data.totalAmount     ? [{ label: 'Amount Due', value: `${currency} ${data.totalAmount.toLocaleString()}` }] : []),
        ...(data.paymentMethod   ? [{ label: 'Payment Method', value: data.paymentMethod }] : []),
        ...(data.receiptNumber   ? [{ label: 'Reference No.', value: `<span style="font-family:monospace;font-size:13px;">${data.receiptNumber}</span>` }] : []),
      ]

      const content = `
        ${greetingBlock(data.name,
          'Registration Received!',
          `your registration for <strong>${event}</strong> has been received successfully.
          Our team will review your payment and confirm your seat within 1–2 business days.`)}

        ${detailRows.length ? detailCard(detailRows) : ''}

        ${alertBox(`<strong>What happens next?</strong><br/>Once our team verifies your payment, you will receive a separate email
          with your confirmed seat number and login credentials to access the event portal.`, 'warning')}

        ${data.eventDate ? `
          ${sectionTitle('Event Details')}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 6px 0;color:#475569;font-size:14px;">
                <span style="font-size:16px;">&#128197;</span>&nbsp;
                <strong>${data.eventDate}</strong>${data.eventTime ? ' &nbsp;at&nbsp; ' + data.eventTime : ''}
              </p>
              ${data.eventVenue ? `<p style="margin:0;color:#475569;font-size:14px;">
                <span style="font-size:16px;">&#128205;</span>&nbsp;
                <strong>${data.eventVenue}</strong>${data.eventAddress ? ', ' + data.eventAddress : ''}
              </p>` : ''}
            </td></tr>
          </table>` : ''}

        <p style="margin:24px 0 0 0;color:#64748b;font-size:14px;line-height:1.6;">
          Thank you for choosing HAMINASS GROUP. We look forward to welcoming you!
        </p>`

      return baseTemplate(content, event)
    }

    /* ── SEAT CONFIRMED ── */
    case 'seat_confirmed': {
      const seats = data.seatNumbers && data.seatNumbers.length > 0
        ? data.seatNumbers.join(', ')
        : 'To be assigned'

      const detailRows = [
        ...(data.receiptNumber  ? [{ label: 'Receipt No.', value: `<span style="font-family:monospace;font-size:13px;">${data.receiptNumber}</span>` }] : []),
        ...(data.selectedPackage? [{ label: 'Package', value: data.selectedPackage }] : []),
        { label: 'Seat(s)', value: `<strong>${seats}</strong>` },
        ...(data.totalAmount    ? [{ label: 'Amount Paid', value: `<strong>${currency} ${data.totalAmount.toLocaleString()}</strong>` }] : []),
        ...(data.paymentMethod  ? [{ label: 'Payment Method', value: data.paymentMethod }] : []),
      ]

      const content = `
        <!-- Status badge -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
          <tr>
            <td style="background:#dcfce7;border-radius:100px;padding:6px 14px;">
              <span style="color:#15803d;font-size:13px;font-weight:700;letter-spacing:0.3px;">&#10003;&nbsp; PAYMENT APPROVED</span>
            </td>
          </tr>
        </table>

        ${greetingBlock(data.name,
          'Your Seat is Confirmed!',
          `great news — your registration for <strong>${event}</strong> has been confirmed and your seat is reserved.`)}

        ${detailCard(detailRows)}

        ${data.eventDate ? `
          ${sectionTitle('Save the Date')}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background:linear-gradient(135deg,#eff6ff,#f0fdf4);border:1px solid #bfdbfe;border-radius:10px;">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0 0 8px 0;color:#1e40af;font-size:15px;font-weight:700;">
                <span style="font-size:18px;">&#128197;</span>&nbsp; ${data.eventDate}${data.eventTime ? ' &nbsp;&bull;&nbsp; ' + data.eventTime : ''}
              </p>
              ${data.eventVenue ? `<p style="margin:0;color:#1e40af;font-size:14px;">
                <span style="font-size:16px;">&#128205;</span>&nbsp; <strong>${data.eventVenue}</strong>${data.eventAddress ? ', ' + data.eventAddress : ''}
              </p>` : ''}
            </td></tr>
          </table>` : ''}

        ${data.loginEmail && data.loginPassword ? `
          ${sectionTitle('Your Login Credentials')}
          <!-- Credentials card -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#16a34a;padding:10px 20px;">
                <p style="margin:0;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                  &#128274;&nbsp; Secure Account Access
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px;">
                <p style="margin:0 0 14px 0;color:#14532d;font-size:14px;line-height:1.6;">
                  Your personal account has been created. Use the credentials below to log in to the event portal.
                </p>
                <!-- Username row -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                  <tr>
                    <td style="background:#ffffff;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;">
                      <p style="margin:0 0 3px 0;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Username (Email)</p>
                      <p style="margin:0;color:#1e293b;font-size:15px;font-weight:600;">${data.loginEmail}</p>
                    </td>
                  </tr>
                </table>
                <!-- Password row -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                  <tr>
                    <td style="background:#ffffff;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;">
                      <p style="margin:0 0 3px 0;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Temporary Password</p>
                      <p style="margin:0;color:#1e293b;font-size:18px;font-weight:700;font-family:'Courier New',Courier,monospace;letter-spacing:2px;">${data.loginPassword}</p>
                    </td>
                  </tr>
                </table>
                ${data.loginUrl ? ctaButton('Login to Your Account', data.loginUrl, '#16a34a') : ''}
                <p style="margin:12px 0 0 0;color:#166534;font-size:12px;line-height:1.6;">
                  &#9888;&nbsp; For your security, please change this temporary password after your first login.
                  You can update it from your account dashboard.
                </p>
              </td>
            </tr>
          </table>` : ''}

        ${alertBox(
          'Please bring a valid photo ID and this email on the day of the event. We look forward to welcoming you!',
          'info'
        )}`

      return baseTemplate(content, event, '#16a34a')
    }

    /* ── PAYMENT DECLINED ── */
    case 'payment_declined': {
      const content = `
        <!-- Status badge -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
          <tr>
            <td style="background:#fee2e2;border-radius:100px;padding:6px 14px;">
              <span style="color:#dc2626;font-size:13px;font-weight:700;letter-spacing:0.3px;">&#10007;&nbsp; ACTION REQUIRED</span>
            </td>
          </tr>
        </table>

        ${greetingBlock(data.name,
          'Payment Not Approved',
          `we were unable to verify your payment for <strong>${event}</strong>. Please see the details below.`)}

        ${data.declineReason
          ? alertBox(`<strong>Reason:</strong> ${data.declineReason}`, 'error')
          : ''}

        ${alertBox(`<strong>What to do next:</strong><br/>
          Please contact our team to resolve this issue or re-submit your payment proof.
          You can reply directly to this email or reach us at
          <a href="mailto:${supportEmail}" style="color:#1e40af;font-weight:600;">${supportEmail}</a>.`, 'warning')}

        <p style="margin:20px 0 0 0;color:#64748b;font-size:14px;line-height:1.6;">
          We apologise for the inconvenience and will work to resolve this as quickly as possible.
        </p>`

      return baseTemplate(content, event, '#dc2626')
    }

    /* ── PAYMENT RECEIVED ── */
    case 'payment_received': {
      const detailRows = [
        ...(data.receiptNumber  ? [{ label: 'Reference No.', value: `<span style="font-family:monospace;font-size:13px;">${data.receiptNumber}</span>` }] : []),
        ...(data.selectedPackage? [{ label: 'Package', value: data.selectedPackage }] : []),
        ...(data.totalAmount    ? [{ label: 'Amount', value: `${currency} ${data.totalAmount.toLocaleString()}` }] : []),
        ...(data.paymentMethod  ? [{ label: 'Payment Method', value: data.paymentMethod }] : []),
      ]

      const content = `
        ${greetingBlock(data.name,
          'Payment Received',
          `we have received your payment for <strong>${event}</strong>. Our team is now reviewing your submission.`)}

        ${detailRows.length ? detailCard(detailRows) : ''}

        ${alertBox('Your seat will be confirmed within 1–2 business days. You will receive another email with your seat number and login credentials once approved.', 'info')}

        <p style="margin:20px 0 0 0;color:#64748b;font-size:14px;">
          Thank you for your patience. We will be in touch shortly!
        </p>`

      return baseTemplate(content, event)
    }

    /* ── WAITLIST ADDED ── */
    case 'waitlist_added': {
      const content = `
        <!-- Status badge -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
          <tr>
            <td style="background:#fef3c7;border-radius:100px;padding:6px 14px;">
              <span style="color:#92400e;font-size:13px;font-weight:700;letter-spacing:0.3px;">&#9201;&nbsp; WAITLISTED</span>
            </td>
          </tr>
        </table>

        ${greetingBlock(data.name,
          "You're on the Waitlist",
          `thank you for your interest in <strong>${event}</strong>. All seats are currently filled,
          but we have added you to our priority waitlist.`)}

        ${data.selectedPackage ? detailCard([{ label: 'Requested Package', value: data.selectedPackage }]) : ''}

        ${alertBox(`Waitlist positions are filled on a <strong>first-come, first-served</strong> basis.
          We will contact you immediately if a seat becomes available for you.`, 'warning')}

        <p style="margin:20px 0 0 0;color:#64748b;font-size:14px;line-height:1.6;">
          We appreciate your enthusiasm and hope to accommodate you. Thank you for your understanding!
        </p>`

      return baseTemplate(content, event, '#d97706')
    }

    /* ── WAITLIST AVAILABLE ── */
    case 'waitlist_available': {
      const content = `
        <!-- Status badge -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
          <tr>
            <td style="background:#dcfce7;border-radius:100px;padding:6px 14px;">
              <span style="color:#15803d;font-size:13px;font-weight:700;letter-spacing:0.3px;">&#127881;&nbsp; SEAT AVAILABLE</span>
            </td>
          </tr>
        </table>

        ${greetingBlock(data.name,
          'Great News — A Seat is Available!',
          `your waitlist position for <strong>${event}</strong> has been reached. A seat is now available for you!`)}

        ${alertBox(`<strong>Time-sensitive:</strong> Please respond within <strong>24 hours</strong> to secure your seat.
          After this window, the seat will be offered to the next person on the waitlist.`, 'warning')}

        ${ctaButton('Confirm My Seat Now', `mailto:${supportEmail}`, '#1d4ed8')}

        <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;text-align:center;">
          Or reply directly to this email to confirm your spot.
        </p>`

      return baseTemplate(content, event, '#15803d')
    }

    /* ── SPONSORSHIP SUBMITTED ── */
    case 'sponsorship_submitted': {
      const detailRows = [
        ...(data.selectedPackage ? [{ label: 'Tier / Package', value: data.selectedPackage }] : []),
        ...(data.totalAmount     ? [{ label: 'Amount', value: `${currency} ${data.totalAmount.toLocaleString()}` }] : []),
        ...(data.paymentMethod   ? [{ label: 'Payment Method', value: data.paymentMethod.replace(/-/g, ' ') }] : []),
        ...(data.receiptNumber   ? [{ label: 'Invoice No.', value: `<span style="font-family:monospace;font-size:13px;">${data.receiptNumber}</span>` }] : []),
      ]

      const content = `
        ${greetingBlock(data.name,
          'Application Received!',
          `thank you for your interest in sponsoring <strong>${event}</strong>.
          Your application has been received and is under review. Our team will be in touch within 1–2 business days.`)}

        ${detailRows.length ? detailCard(detailRows) : ''}

        ${alertBox(`<strong>What happens next?</strong><br/>
          Our partnerships team will review your application and verify your payment details.
          Once confirmed, you will receive a separate email with your official invoice and sponsorship confirmation.`, 'warning')}

        ${data.eventDate ? `
          ${sectionTitle('Event Details')}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 6px 0;color:#475569;font-size:14px;">
                <span style="font-size:16px;">&#128197;</span>&nbsp;
                <strong>${data.eventDate}</strong>${data.eventTime ? ' &nbsp;at&nbsp; ' + data.eventTime : ''}
              </p>
              ${data.eventVenue ? `<p style="margin:0;color:#475569;font-size:14px;">
                <span style="font-size:16px;">&#128205;</span>&nbsp;
                <strong>${data.eventVenue}</strong>
              </p>` : ''}
            </td></tr>
          </table>` : ''}

        <p style="margin:24px 0 0 0;color:#64748b;font-size:14px;line-height:1.6;">
          We appreciate your support of ${event}. For immediate assistance, please reply to this email.
        </p>`

      return baseTemplate(content, event)
    }

    /* ── SPONSORSHIP APPROVED ── */
    case 'sponsorship_approved': {
      const siteUrl = process.env.SITE_URL || 'https://e-masterclass.eopsprimax.com'
      const detailRows = [
        ...(data.receiptNumber   ? [{ label: 'Invoice No.', value: `<span style="font-family:monospace;font-size:13px;">${data.receiptNumber}</span>` }] : []),
        ...(data.selectedPackage ? [{ label: 'Sponsorship Tier', value: data.selectedPackage }] : []),
        ...(data.totalAmount     ? [{ label: 'Amount Paid', value: `<strong>${currency} ${data.totalAmount.toLocaleString()}</strong>` }] : []),
        ...(data.paymentMethod   ? [{ label: 'Payment Method', value: data.paymentMethod.replace(/-/g, ' ') }] : []),
      ]

      const content = `
        <!-- Status badge -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
          <tr>
            <td style="background:#dcfce7;border-radius:100px;padding:6px 14px;">
              <span style="color:#15803d;font-size:13px;font-weight:700;letter-spacing:0.3px;">&#10003;&nbsp; SPONSORSHIP CONFIRMED</span>
            </td>
          </tr>
        </table>

        ${greetingBlock(data.name,
          'Your Sponsorship is Confirmed!',
          `great news — your sponsorship of <strong>${event}</strong> has been approved and confirmed. Welcome aboard!`)}

        ${detailCard(detailRows)}

        ${data.eventDate ? `
          ${sectionTitle('Event Details')}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background:linear-gradient(135deg,#eff6ff,#f0fdf4);border:1px solid #bfdbfe;border-radius:10px;">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0 0 8px 0;color:#1e40af;font-size:15px;font-weight:700;">
                <span style="font-size:18px;">&#128197;</span>&nbsp; ${data.eventDate}${data.eventTime ? ' &nbsp;&bull;&nbsp; ' + data.eventTime : ''}
              </p>
              ${data.eventVenue ? `<p style="margin:0;color:#1e40af;font-size:14px;">
                <span style="font-size:16px;">&#128205;</span>&nbsp; <strong>${data.eventVenue}</strong>
              </p>` : ''}
            </td></tr>
          </table>` : ''}

        ${alertBox(
          `Your invoice is attached for your records. You can also <a href="${siteUrl}/sponsorship" style="color:#1e40af;font-weight:600;">visit the sponsorship page</a> to view your listing once it goes live.`,
          'info'
        )}`

      return baseTemplate(content, event, '#16a34a')
    }

    default:
      return baseTemplate(
        `<p style="color:#475569;font-size:15px;">Hello <strong>${data.name}</strong>, you have a notification regarding <strong>${event}</strong>.</p>`,
        event
      )
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
    payment_declined: `Payment Not Approved — ${data.eventName || 'Executive Masterclass'}`,
    waitlist_added: `Added to Waitlist — ${data.eventName || 'Executive Masterclass'}`,
    waitlist_available: `Seat Available for You! — ${data.eventName || 'Executive Masterclass'}`,
    event_reminder: `Event Reminder — ${data.eventName || 'Executive Masterclass'}`,
    receipt: `Payment Receipt — ${data.eventName || 'Executive Masterclass'}`,
    sponsorship_submitted: `Sponsorship Application Received — ${data.eventName || 'Executive Masterclass'}`,
    sponsorship_approved: `Your Sponsorship is Confirmed! — ${data.eventName || 'Executive Masterclass'}`,
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
