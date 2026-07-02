import type { BookingNotificationPayload, NotificationResult } from '@/services/notifications/notification.types';

export interface NotificationProvider {
  sendBookingConfirmation(payload: BookingNotificationPayload): Promise<NotificationResult>;
}

export class UiNotificationProvider implements NotificationProvider {
  async sendBookingConfirmation(payload: BookingNotificationPayload): Promise<NotificationResult> {
    return {
      channel: 'ui',
      delivered: true,
      message: `Booking ${payload.bookingNumber} has been received for ${payload.customerName}.`,
    };
  }
}

export const notificationProvider = new UiNotificationProvider();
