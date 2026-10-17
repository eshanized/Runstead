import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Console | Runstead',
  description: 'Operating platform for web hosting businesses and reseller infrastructure.',
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
