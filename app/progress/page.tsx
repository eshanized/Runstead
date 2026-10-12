import { Metadata } from 'next';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { ProgressDashboard } from '@/components/progress/progress-dashboard';
import { getProjectProgress } from '@/lib/github/client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Live Development Progress & Roadmap | Runstead',
  description:
    'Real-time engineering progress, verified milestones, testing readiness, and delivery forecast for the Runstead hosting platform.',
};

export default async function ProgressPage() {
  const progressData = await getProjectProgress();

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ProgressDashboard initialData={progressData} />
      </div>
    </MarketingLayout>
  );
}
