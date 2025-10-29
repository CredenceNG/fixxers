'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide global footer for admin routes (they use AdminLTE footer)
  // Also hide for fixer and agent dashboards
  const hideFooter = pathname.startsWith('/admin/') ||
                     pathname.startsWith('/fixer/') ||
                     pathname.startsWith('/agent/');

  if (hideFooter) {
    return null;
  }

  return <Footer />;
}
