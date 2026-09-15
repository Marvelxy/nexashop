import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const from = process.env.RESEND_FROM ?? "NexaShop <onboarding@resend.dev>";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set. Reset link for ${email}: ${resetUrl}`);
    return;
  }

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Reset your NexaShop password",
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  if (error) throw new Error(error.message);
}