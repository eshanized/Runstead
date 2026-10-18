import { env } from '../config/env.ts';

export interface NotificationPayload {
  to: string;
  subject: string;
  template: 'order_confirmed' | 'payment_succeeded' | 'service_provisioned' | 'ticket_reply' | 'password_reset' | 'email_verification';
  data: Record<string, any>;
  tenantName?: string;
}

export interface NotificationResult {
  accepted: boolean;
  messageId?: string;
  status: 'sent' | 'queued' | 'mock_delivered' | 'failed';
  error?: string;
}

/**
 * Transactional notification delivery service.
 * Supports Resend API or logs safely with explicit mock/sandbox delivery when unconfigured.
 */
export async function sendTransactionalNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const from = env.EMAIL_FROM || 'notifications@runstead.org';

  // 1. If Resend API Key is configured, make real API request
  if (env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from,
          to: payload.to,
          subject: payload.subject,
          text: payload.template === 'email_verification' && typeof payload.data.verificationUrl === 'string'
            ? `Verify your Runstead email address by opening this single-use link:\n\n${payload.data.verificationUrl}\n\nThis link expires in 30 minutes. If you did not create a Runstead account, you can ignore this message.`
            : `Notification: ${payload.subject}\n\nDetails: ${JSON.stringify(payload.data, null, 2)}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          accepted: false,
          status: 'failed',
          error: `Resend API error (${response.status}): ${errorText}`,
        };
      }

      const resData = await response.json() as { id?: string };
      return {
        accepted: true,
        messageId: resData.id,
        status: 'sent',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        accepted: false,
        status: 'failed',
        error: msg,
      };
    }
  }

  // 2. Unconfigured state: fail closed in production, truthfully mark unaccepted in dev/test
  if (process.env.NODE_ENV === 'production') {
    return {
      accepted: false,
      status: 'failed',
      error: 'Production email delivery failed: RESEND_API_KEY is not configured.',
    };
  }

  const mockId = `mock-email-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return {
    accepted: false,
    messageId: mockId,
    status: 'mock_delivered',
    error: 'Email delivery simulated in development/test: RESEND_API_KEY is not configured.',
  };
}
