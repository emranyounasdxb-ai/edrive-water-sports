'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  operationsVehicles,
  seedOperationsBookings,
  type BookingActivity,
  type BookingStatus,
  type FleetVehicle,
  type OperationsBooking,
  type StaffRole,
} from './operations-data';

const STORAGE_KEY = 'edrive-operations-v1';

type UpdateMeta = {
  actor: string;
  role: StaffRole;
  note?: string;
  action?: string;
};

type OperationsContextValue = {
  bookings: OperationsBooking[];
  vehicles: FleetVehicle[];
  updateBooking: (bookingId: string, patch: Partial<OperationsBooking>, meta: UpdateMeta) => void;
  resetDemo: () => void;
};

const OperationsContext = createContext<OperationsContextValue | null>(null);

function fleetStatusForBooking(booking: OperationsBooking): FleetVehicle['status'] {
  if (booking.damageReported) return 'Damaged';
  if (booking.bookingStatus === 'In Progress') return 'In Ride';
  if (booking.bookingStatus === 'Completed' || booking.bookingStatus === 'Cancelled' || booking.bookingStatus === 'No Show') return 'Available';
  return 'Assigned';
}

export function OperationsProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<OperationsBooking[]>(seedOperationsBookings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBookings(JSON.parse(saved) as OperationsBooking[]);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings, hydrated]);

  const updateBooking = useCallback((bookingId: string, patch: Partial<OperationsBooking>, meta: UpdateMeta) => {
    setBookings((current) => {
      const nextBookings = current.map((booking) => {
      if (booking.id !== bookingId) return booking;
      const nextStatus = patch.bookingStatus ?? booking.bookingStatus;
      const statusChanged = nextStatus !== booking.bookingStatus;
      const now = new Date().toISOString();
      const nextActivity: BookingActivity = {
        id: `${booking.id}-${Date.now()}`,
        action: meta.action ?? (statusChanged ? `Status updated to ${nextStatus}` : 'Booking details updated'),
        actor: meta.actor,
        role: meta.role,
        createdAt: now,
        note: meta.note,
        previousStatus: statusChanged ? booking.bookingStatus : undefined,
        newStatus: statusChanged ? nextStatus : undefined,
      };
      const finalAmount = patch.finalAmount ?? booking.finalAmount;
      const amountReceived = patch.amountReceived ?? booking.amountReceived;
      return {
        ...booking,
        ...patch,
        amountPending: Math.max(finalAmount - amountReceived, 0),
        updatedAt: now,
        activity: [...booking.activity, nextActivity],
      };
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBookings));
      return nextBookings;
    });
  }, []);

  const vehicles = useMemo(() => operationsVehicles.map((vehicle) => {
    const activeBooking = bookings.find((booking) => booking.assignedVehicleId === vehicle.id && ['Confirmed', 'Ready', 'In Progress'].includes(booking.bookingStatus));
    if (!activeBooking) {
      if (vehicle.status === 'Damaged' || vehicle.status === 'Maintenance' || vehicle.status === 'Out of Service') return vehicle;
      return { ...vehicle, status: 'Available' as const };
    }
    return { ...vehicle, status: fleetStatusForBooking(activeBooking) };
  }), [bookings]);

  const resetDemo = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setBookings(seedOperationsBookings);
  }, []);

  const value = useMemo(() => ({ bookings, vehicles, updateBooking, resetDemo }), [bookings, vehicles, updateBooking, resetDemo]);
  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperations() {
  const value = useContext(OperationsContext);
  if (!value) throw new Error('useOperations must be used inside OperationsProvider.');
  return value;
}

export function isManagerVisible(status: BookingStatus) {
  return ['Confirmed', 'Ready', 'In Progress', 'Completed', 'Cancelled', 'No Show', 'Rescheduled'].includes(status);
}
