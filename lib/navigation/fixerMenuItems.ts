export const fixerMenuItems = [
  {
    label: 'Dashboard',
    href: '/fixer/dashboard',
    icon: '📊',
  },
  {
    label: 'My Gigs',
    href: '/fixer/gigs',
    icon: '💼',
    children: [
      { label: 'All Gigs', href: '/fixer/gigs', icon: '' },
      { label: 'Create New Gig', href: '/fixer/gigs/create', icon: '' },
      { label: 'Active Gigs', href: '/fixer/gigs?status=active', icon: '' },
      { label: 'Paused Gigs', href: '/fixer/gigs?status=paused', icon: '' },
    ],
  },
  {
    label: 'Service Requests',
    href: '/fixer/requests',
    icon: '📝',
    badge: '',
    badgeColor: '#28a745',
  },
  {
    label: 'Quotes',
    href: '/fixer/quotes',
    icon: '💰',
    children: [
      { label: 'All Quotes', href: '/fixer/quotes', icon: '' },
      { label: 'Pending', href: '/fixer/quotes?status=PENDING', icon: '', badge: '', badgeColor: '#ffc107' },
      { label: 'Accepted', href: '/fixer/quotes?status=ACCEPTED', icon: '' },
      { label: 'Rejected', href: '/fixer/quotes?status=REJECTED', icon: '' },
    ],
  },
  {
    label: 'Orders',
    href: '/fixer/orders',
    icon: '📦',
    children: [
      { label: 'Active Orders', href: '/fixer/orders?status=IN_PROGRESS', icon: '', badge: '', badgeColor: '#007bff' },
      { label: 'Pending', href: '/fixer/orders?status=PENDING', icon: '' },
      { label: 'Completed', href: '/fixer/orders?status=COMPLETED', icon: '' },
      { label: 'All Orders', href: '/fixer/orders', icon: '' },
    ],
  },
  {
    label: 'Reviews',
    href: '/fixer/reviews',
    icon: '⭐',
  },
  {
    label: 'Trust Badges',
    href: '/fixer/badges',
    icon: '🛡️',
    children: [
      { label: 'My Badges', href: '/fixer/badges', icon: '' },
      { label: 'Request Badge', href: '/fixer/badges/request', icon: '' },
    ],
  },
  {
    label: 'Earnings',
    href: '/fixer/earnings',
    icon: '💵',
    children: [
      { label: 'Overview', href: '/fixer/earnings', icon: '' },
      { label: 'Wallet', href: '/fixer/wallet', icon: '' },
      { label: 'Withdrawal History', href: '/fixer/withdrawals', icon: '' },
    ],
  },
  {
    label: 'Messages',
    href: '/fixer/messages',
    icon: '💬',
    badge: '',
    badgeColor: '#dc3545',
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: '👤',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: '⚙️',
  },
];
