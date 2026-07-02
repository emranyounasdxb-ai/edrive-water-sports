'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, Check, CircleDollarSign, Phone, Save, UserRound, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  collectionStatuses,
  formatAed,
  managerStatuses,
  paymentMethods,
  paymentStatuses,
  type BookingStatus,
  type FleetVehicle,
  type OperationsBooking,
} from './operations-data';
import { useOperations } from './operations-store';
import { CollectionBadge, nativeSelectClassName, PaymentBadge, StatusBadge } from './shared';

type BookingDetailPanelProps = {
  booking: OperationsBooking | null;
  mode: 'admin' | 'manager';
  onClose: () => void;
};

export function BookingDetailPanel({ booking, mode, onClose }: BookingDetailPanelProps) {
  const { updateBooking, vehicles } = useOperations();
  const [draft, setDraft] = useState<OperationsBooking | null>(booking);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(booking);
    setSaved(false);
  }, [booking?.id]);

  if (!draft) return null;

  const updateDraft = <K extends keyof OperationsBooking>(key: K, value: OperationsBooking[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setSaved(false);
  };

  const runAdminAction = (status: BookingStatus) => {
    const confirmed = status === 'Confirmed';
    updateBooking(draft.id, {
      bookingStatus: status,
      adminStatus: status,
      managerStatus: confirmed ? 'Confirmed' : draft.managerStatus,
      assignedManagerId: confirmed ? (draft.assignedManagerId ?? 'manager-1') : draft.assignedManagerId,
      assignedManagerName: confirmed ? (draft.assignedManagerName ?? 'Mohammed Ali') : draft.assignedManagerName,
    }, {
      actor: 'Admin User',
      role: 'admin',
      action: status === 'Confirmed' ? 'Admin confirmed booking and moved it to operations' : `Admin marked booking ${status}`,
      note: confirmed ? 'Booking is now visible to the booking manager.' : undefined,
    });
    setDraft((current) => current ? { ...current, bookingStatus: status, adminStatus: status, managerStatus: confirmed ? 'Confirmed' : current.managerStatus } : current);
    setSaved(true);
  };

  const saveManagerUpdate = () => {
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === draft.assignedVehicleId);
    updateBooking(draft.id, {
      ...draft,
      assignedVehicleName: selectedVehicle?.name ?? draft.assignedVehicleName,
      managerStatus: draft.bookingStatus,
      adminStatus: draft.adminStatus === 'New / Pending' ? 'Confirmed' : draft.adminStatus,
    }, {
      actor: 'Mohammed Ali',
      role: 'booking_manager',
      action: 'Manager saved operations update',
      note: draft.managerNote || 'Operational details, payment, and assignment saved.',
    });
    setSaved(true);
  };

  return (
    <Sheet open={Boolean(booking)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent>
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={draft.bookingStatus} />
            <Badge variant="secondary">{draft.source}</Badge>
          </div>
          <SheetTitle className="mt-2">{mode === 'manager' ? 'Edit booking' : 'Booking details'}: {draft.bookingCode}</SheetTitle>
          <SheetDescription>{draft.customerName} · {draft.serviceType} · Updated {new Date(draft.updatedAt).toLocaleString('en-AE')}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3">
            <PanelSection title="Customer" icon={UserRound}>
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoRow label="Name" value={draft.customerName} />
                <InfoRow label="Phone" value={draft.customerPhone} />
                <InfoRow label="Email" value={draft.customerEmail} />
                <InfoRow label="Guests" value={`${draft.guestCount}`} />
                <InfoRow label="Schedule" value={`${draft.preferredDate} · ${draft.preferredTime}`} />
                <InfoRow label="Meeting point" value={draft.meetingLocation} />
              </div>
              {draft.customerNote ? <p className="mt-3 rounded-xl bg-muted/70 p-3 text-xs leading-5 text-muted-foreground">Customer note: {draft.customerNote}</p> : null}
            </PanelSection>

            {mode === 'admin' ? (
              <PanelSection title="Admin actions" icon={Phone}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Button type="button" size="sm" variant="outline" onClick={() => runAdminAction('Contacted')}>Mark Contacted</Button>
                  <Button type="button" size="sm" onClick={() => runAdminAction('Confirmed')}><Check data-icon="inline-start" aria-hidden="true" />Confirm</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => runAdminAction('Rescheduled')}><CalendarClock data-icon="inline-start" aria-hidden="true" />Reschedule</Button>
                  <Button type="button" size="sm" variant="danger" onClick={() => runAdminAction('Cancelled')}>Cancel</Button>
                </div>
                {saved ? <SuccessMessage text={draft.bookingStatus === 'Confirmed' ? 'Confirmed and visible in Manager / Operations.' : 'Booking status updated.'} /> : null}
              </PanelSection>
            ) : (
              <PanelSection title="Booking status" icon={Check}>
                <div className="flex flex-wrap gap-2">
                  {managerStatuses.map((status) => (
                    <Button key={status} type="button" size="sm" variant={draft.bookingStatus === status ? 'default' : 'outline'} onClick={() => updateDraft('bookingStatus', status)}>{status}</Button>
                  ))}
                </div>
              </PanelSection>
            )}

            <PanelSection title="Operation" icon={Wrench}>
              <FieldGroup className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="assigned-vehicle">Assigned vehicle</FieldLabel>
                  <select id="assigned-vehicle" className={nativeSelectClassName} value={draft.assignedVehicleId ?? ''} disabled={mode === 'admin'} onChange={(event) => updateDraft('assignedVehicleId', event.target.value || null)}>
                    <option value="">Select vehicle</option>
                    {vehicles.filter((vehicle) => vehicle.type === draft.serviceType || vehicle.id === draft.assignedVehicleId).map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.status}</option>)}
                  </select>
                </Field>
                {(draft.vehicleType === 'jet_car' || draft.vehicleType === 'boat') ? (
                  <Field>
                    <FieldLabel htmlFor="captain-name">Captain name</FieldLabel>
                    <Input id="captain-name" value={draft.captainName} disabled={mode === 'admin'} onChange={(event) => updateDraft('captainName', event.target.value)} />
                  </Field>
                ) : null}
                {draft.vehicleType === 'jet_ski' ? (
                  <>
                    <Field>
                      <FieldLabel htmlFor="driver-required">Driver required</FieldLabel>
                      <label className="flex h-10 items-center gap-3 rounded-md border border-input bg-white px-3 text-sm">
                        <input id="driver-required" type="checkbox" checked={draft.driverRequired} disabled={mode === 'admin'} onChange={(event) => updateDraft('driverRequired', event.target.checked)} />
                        {draft.driverRequired ? 'Yes' : 'No'}
                      </label>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="driver-name">Driver name</FieldLabel>
                      <Input id="driver-name" value={draft.driverName} disabled={mode === 'admin' || !draft.driverRequired} onChange={(event) => updateDraft('driverName', event.target.value)} />
                    </Field>
                  </>
                ) : null}
                <Field>
                  <FieldLabel htmlFor="ride-start">Ride start</FieldLabel>
                  <Input id="ride-start" type="datetime-local" value={draft.rideStartTime} disabled={mode === 'admin'} onChange={(event) => updateDraft('rideStartTime', event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ride-end">Ride end</FieldLabel>
                  <Input id="ride-end" type="datetime-local" value={draft.rideEndTime} disabled={mode === 'admin'} onChange={(event) => updateDraft('rideEndTime', event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="extra-time">Extra time (minutes)</FieldLabel>
                  <Input id="extra-time" type="number" min="0" value={draft.extraTimeMinutes} disabled={mode === 'admin'} onChange={(event) => updateDraft('extraTimeMinutes', Number(event.target.value))} />
                </Field>
                <BooleanField id="customer-arrived" label="Customer arrived" value={draft.customerArrived} disabled={mode === 'admin'} onChange={(value) => updateDraft('customerArrived', value)} />
                <BooleanField id="damage-reported" label="Damage reported" value={draft.damageReported} disabled={mode === 'admin'} onChange={(value) => updateDraft('damageReported', value)} />
              </FieldGroup>
              {draft.damageReported ? (
                <Field className="mt-4">
                  <FieldLabel htmlFor="damage-note">Damage note</FieldLabel>
                  <Textarea id="damage-note" value={draft.damageNote} disabled={mode === 'admin'} onChange={(event) => updateDraft('damageNote', event.target.value)} />
                </Field>
              ) : null}
            </PanelSection>

            <PanelSection title="Payment" icon={CircleDollarSign}>
              <div className="mb-4 flex flex-wrap gap-2"><PaymentBadge status={draft.paymentStatus} /><CollectionBadge status={draft.collectionStatus} /></div>
              <FieldGroup className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="final-amount">Final amount</FieldLabel>
                  <Input id="final-amount" type="number" min="0" value={draft.finalAmount} disabled={mode === 'admin'} onChange={(event) => updateDraft('finalAmount', Number(event.target.value))} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="received-amount">Amount received</FieldLabel>
                  <Input id="received-amount" type="number" min="0" value={draft.amountReceived} disabled={mode === 'admin'} onChange={(event) => updateDraft('amountReceived', Number(event.target.value))} />
                </Field>
                <Field>
                  <FieldLabel>Amount pending</FieldLabel>
                  <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm font-semibold text-gold-deep">{formatAed(Math.max(draft.finalAmount - draft.amountReceived, 0))}</div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="payment-status">Payment status</FieldLabel>
                  <select id="payment-status" className={nativeSelectClassName} value={draft.paymentStatus} disabled={mode === 'admin'} onChange={(event) => updateDraft('paymentStatus', event.target.value as OperationsBooking['paymentStatus'])}>{paymentStatuses.map((item) => <option key={item}>{item}</option>)}</select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="payment-method">Payment method</FieldLabel>
                  <select id="payment-method" className={nativeSelectClassName} value={draft.paymentMethod} disabled={mode === 'admin'} onChange={(event) => updateDraft('paymentMethod', event.target.value as OperationsBooking['paymentMethod'])}>{paymentMethods.map((item) => <option key={item}>{item}</option>)}</select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="collection-status">Collection status</FieldLabel>
                  <select id="collection-status" className={nativeSelectClassName} value={draft.collectionStatus} disabled={mode === 'admin'} onChange={(event) => updateDraft('collectionStatus', event.target.value as OperationsBooking['collectionStatus'])}>{collectionStatuses.map((item) => <option key={item}>{item}</option>)}</select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="collected-by">Collected by</FieldLabel>
                  <Input id="collected-by" value={draft.paymentCollectedBy} disabled={mode === 'admin'} onChange={(event) => updateDraft('paymentCollectedBy', event.target.value)} />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="payment-note">Payment note</FieldLabel>
                  <Input id="payment-note" value={draft.paymentNotes} disabled={mode === 'admin'} onChange={(event) => updateDraft('paymentNotes', event.target.value)} />
                </Field>
              </FieldGroup>
            </PanelSection>

            <PanelSection title="Internal notes" icon={Save}>
              <FieldGroup className="sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="manager-note">Manager note</FieldLabel>
                  <Textarea id="manager-note" value={draft.managerNote} disabled={mode === 'admin'} onChange={(event) => updateDraft('managerNote', event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="internal-note">Internal note</FieldLabel>
                  <Textarea id="internal-note" value={draft.internalNote} disabled={mode === 'admin'} onChange={(event) => updateDraft('internalNote', event.target.value)} />
                </Field>
              </FieldGroup>
            </PanelSection>

            <PanelSection title="Activity & history" icon={CalendarClock}>
              <ol className="relative ml-2 border-l border-primary/20">
                {[...draft.activity].reverse().map((item) => (
                  <li key={item.id} className="relative pb-5 pl-5 last:pb-0">
                    <span className="absolute -left-1.5 top-1.5 size-3 rounded-full border-2 border-white bg-primary" />
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><p className="text-sm font-semibold text-foreground">{item.action}</p><p className="mt-1 text-xs text-muted-foreground">{item.actor} · {item.role.replaceAll('_', ' ')}</p></div>
                      <time className="text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString('en-AE')}</time>
                    </div>
                    {item.note ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p> : null}
                  </li>
                ))}
              </ol>
            </PanelSection>
          </div>
        </div>

        <SheetFooter>
          {saved ? <SuccessMessage text="Latest updates are reflected across Admin and Reports." compact /> : null}
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          {mode === 'manager' ? <Button type="button" onClick={saveManagerUpdate}><Save data-icon="inline-start" aria-hidden="true" />Save Operations Update</Button> : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function PanelSection({ title, icon: Icon, children }: { title: string; icon: typeof UserRound; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center gap-2"><Icon className="size-4 text-primary" aria-hidden="true" /><h3 className="text-sm font-semibold text-foreground">{title}</h3></div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p></div>;
}

function BooleanField({ id, label, value, disabled, onChange }: { id: string; label: string; value: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <label className={cn('flex h-10 items-center gap-3 rounded-md border border-input bg-white px-3 text-sm', disabled && 'opacity-60')}>
        <input id={id} type="checkbox" checked={value} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
        {value ? 'Yes' : 'No'}
      </label>
    </Field>
  );
}

function SuccessMessage({ text, compact = false }: { text: string; compact?: boolean }) {
  return <p role="status" className={cn('flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700', compact && 'mr-auto')}><Check className="size-4" aria-hidden="true" />{text}</p>;
}
