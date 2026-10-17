import { redirect } from 'next/navigation';

export default function DemoOverviewRedirect() {
  redirect('/dashboard/overview');
}
