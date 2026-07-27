'use client';

import { AdminPaymentsControlCenter } from './admin-payments-control-center';
import { ManagerCollectionsPage } from './manager-collections-page';
import { usePortalAccess } from './portal-access';

export function PaymentsRoutePage() {
  const { loading, role, fullName, email } = usePortalAccess();

  if (loading) return <PaymentsSkeleton />;
  if (role === 'manager') return <ManagerCollectionsPage manager={{ name: fullName, email }} />;
  return <AdminPaymentsControlCenter />;
}

function PaymentsSkeleton() {
  return <section className="animate-pulse space-y-4"><div><div className="h-3 w-24 rounded bg-primary-100" /><div className="mt-3 h-9 w-72 max-w-full rounded bg-slate-200" /><div className="mt-2 h-4 w-[30rem] max-w-full rounded bg-slate-100" /></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 rounded-2xl bg-white shadow-sm" />)}</div><div className="h-80 rounded-2xl bg-white shadow-sm" /></section>;
}
