import { getCurrentUser } from '@/lib/auth';
import MobileHeader from './MobileHeader';

export default async function Header() {
  const user = await getCurrentUser();

  return <MobileHeader user={user} />;
}
