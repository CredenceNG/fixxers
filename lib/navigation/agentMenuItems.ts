export const agentMenuItems = [
  {
    label: 'Dashboard',
    href: '/agent/dashboard',
    icon: '📊',
  },
  {
    label: 'My Fixers',
    href: '/agent/fixers',
    icon: '🔧',
    children: [
      { label: 'All Fixers', href: '/agent/fixers', icon: '' },
      { label: 'Pending Approval', href: '/agent/fixers?status=PENDING', icon: '', badge: '', badgeColor: '#ffc107' },
      { label: 'Active Fixers', href: '/agent/fixers?status=APPROVED', icon: '' },
      { label: 'Add New Fixer', href: '/agent/fixers/add', icon: '' },
    ],
  },
  {
    label: 'My Clients',
    href: '/agent/clients',
    icon: '👥',
    children: [
      { label: 'All Clients', href: '/agent/clients', icon: '' },
      { label: 'Add New Client', href: '/agent/clients/add', icon: '' },
    ],
  },
  {
    label: 'Service Requests',
    href: '/agent/requests',
    icon: '📝',
    badge: '',
    badgeColor: '#28a745',
  },
  {
    label: 'Gigs',
    href: '/agent/gigs',
    icon: '💼',
    children: [
      { label: 'All Gigs', href: '/agent/gigs', icon: '' },
      { label: 'Create for Fixer', href: '/agent/gigs/create', icon: '' },
    ],
  },
  {
    label: 'Quotes',
    href: '/agent/quotes',
    icon: '💰',
    children: [
      { label: 'All Quotes', href: '/agent/quotes', icon: '' },
      { label: 'Submit for Fixer', href: '/agent/quotes/create', icon: '' },
    ],
  },
  {
    label: 'Orders',
    href: '/agent/orders',
    icon: '📦',
    badge: '',
    badgeColor: '#007bff',
  },
  {
    label: 'Commissions',
    href: '/agent/commissions',
    icon: '💵',
    children: [
      { label: 'Overview', href: '/agent/commissions', icon: '' },
      { label: 'Earnings', href: '/agent/earnings', icon: '' },
      { label: 'Bonuses', href: '/agent/bonuses', icon: '' },
    ],
  },
  {
    label: 'Territory',
    href: '/agent/territory',
    icon: '🗺️',
    children: [
      { label: 'My Neighborhoods', href: '/agent/territory', icon: '' },
      { label: 'Request Expansion', href: '/agent/territory/request', icon: '' },
    ],
  },
  {
    label: 'Reports',
    href: '/agent/reports',
    icon: '📈',
  },
  {
    label: 'Messages',
    href: '/agent/messages',
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
