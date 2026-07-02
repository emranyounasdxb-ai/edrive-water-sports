export type NotificationChannel = 'ui' | 'whatsapp' | 'email' | 'sms';

export type BookingNotificationPayload = {
  bookingNumber: string;
  customerName: string;
  vehicleName: string;
  startAt: string;
  netAmountAed: number;
};

export type NotificationResult = {
  channel: NotificationChannel;
  delivered: boolean;
  message: string;
};
