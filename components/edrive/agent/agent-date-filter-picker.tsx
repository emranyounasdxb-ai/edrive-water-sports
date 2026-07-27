'use client';

import { AppDatePicker, type AppDatePickerProps } from '@/components/edrive/shared/app-date-picker';

export function AgentDateFilterPicker(props: AppDatePickerProps) {
  return <AppDatePicker {...props} triggerClassName={props.triggerClassName || 'lg:w-44'} />;
}
