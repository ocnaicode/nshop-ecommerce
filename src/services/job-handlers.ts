// =============================================================================
// Background Job Handlers - used by the queue service
// Each handler is a thin wrapper around the actual service call so jobs can
// run either via BullMQ workers or inline (no-Redis fallback).
// =============================================================================

import type { QueueJob } from './queue.service';
import { sendEmail } from './email.service';
import { sendSms } from './sms.service';
import { sendNotification } from './notification.service';

export async function handleBackgroundJob(job: QueueJob): Promise<void> {
  const { name, data } = job;

  switch (name) {
    case 'send-email': {
      const { to, subject, html, text } = data as Record<string, string>;
      if (to && subject) await sendEmail({ to, subject, html, text });
      break;
    }
    case 'send-sms': {
      const { to, body } = data as Record<string, string>;
      if (to && body) await sendSms({ to, body });
      break;
    }
    case 'send-notification': {
      const { userId, event, message, data: payload } = data as Record<string, any>;
      if (userId && event) {
        await sendNotification({ userId, event, data: payload });
      }
      break;
    }
    case 'low-stock-alert': {
      const { sellerId, productName } = data as Record<string, string>;
      if (sellerId && productName) {
        await sendNotification({
          userId: sellerId,
          event: 'low_stock',
          data: { productName },
        });
      }
      break;
    }
    case 'analytics-ingest': {
      // Analytics events are ingested directly by the analytics service;
      // queued ingestion is a no-op placeholder for future aggregation workers.
      console.log('[queue] analytics-ingest job received:', JSON.stringify(data).slice(0, 200));
      break;
    }
    case 'subscription-check': {
      console.log('[queue] subscription-check job received:', JSON.stringify(data).slice(0, 200));
      break;
    }
    default: {
      console.log('[queue] unknown job type:', (job as QueueJob).name);
    }
  }
}
