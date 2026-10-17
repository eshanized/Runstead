import { redirect } from 'next/navigation';

export default function DemoRootRedirect() {
  redirect('/dashboard/overview');
}
