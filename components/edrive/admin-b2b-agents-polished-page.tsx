'use client';

import { AdminB2BAgentsCleanPage } from './admin-b2b-agents-page';
import { B2BAgentCountryForm } from './b2b-agent-country-form';

export function AdminB2BAgentsPolishedPage() {
  return (
    <div className="b2b-agents-polished">
      <B2BAgentCountryForm />
      <AdminB2BAgentsCleanPage />
      <style jsx global>{`
        .b2b-country-form[data-visible='true'] + section > div > div[class*='mt-5'][class*='grid-cols-1'] + div[class*='mt-5'] {
          display: none !important;
        }

        .b2b-agents-polished table tbody td:first-child button:hover div:first-child {
          color: hsl(var(--primary));
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .b2b-agents-polished table tbody td:last-child > div {
          flex-wrap: nowrap !important;
          align-items: center;
        }

        .b2b-agents-polished table tbody td:last-child > div > button:nth-child(2),
        .b2b-agents-polished table tbody td:last-child > div > button:nth-child(3),
        .b2b-agents-polished table tbody td:last-child > div > button:nth-child(4) {
          display: none !important;
        }

        .b2b-agents-polished table tbody td:last-child > div > button:first-child {
          min-width: 118px;
          justify-content: center;
          font-size: 0 !important;
          white-space: nowrap;
        }

        .b2b-agents-polished table tbody td:last-child > div > button:first-child svg {
          display: none !important;
        }

        .b2b-agents-polished table tbody td:last-child > div > button:first-child::after {
          content: 'Open Profile';
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
        }

        .b2b-agents-polished table tbody tr {
          vertical-align: middle;
        }

        .b2b-agents-polished [class*="md:hidden"] [class*="mt-4"][class*="grid"][class*="gap-2"] > button:nth-child(2),
        .b2b-agents-polished [class*="md:hidden"] [class*="mt-4"][class*="grid"][class*="gap-2"] > button:nth-child(3),
        .b2b-agents-polished [class*="md:hidden"] [class*="mt-4"][class*="grid"][class*="gap-2"] > button:nth-child(4) {
          display: none !important;
        }

        .b2b-agents-polished [class*="md:hidden"] [class*="mt-4"][class*="grid"][class*="gap-2"] > button:first-child {
          font-size: 0 !important;
        }

        .b2b-agents-polished [class*="md:hidden"] [class*="mt-4"][class*="grid"][class*="gap-2"] > button:first-child svg {
          display: none !important;
        }

        .b2b-agents-polished [class*="md:hidden"] [class*="mt-4"][class*="grid"][class*="gap-2"] > button:first-child::after {
          content: 'Open Profile';
          font-size: 12px;
          font-weight: 800;
        }
      `}</style>
    </div>
  );
}
