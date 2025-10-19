export const adminMenuItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: '📊',
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: '👥',
    children: [
      { label: 'All Users', href: '/admin/users', icon: '' },
      { label: 'Clients', href: '/admin/users?role=CLIENT', icon: '' },
      { label: 'Fixers', href: '/admin/users?role=FIXER', icon: '' },
    ],
  },
  {
    label: 'Agents',
    href: '/admin/agents',
    icon: '🤝',
    children: [
      { label: 'All Agents', href: '/admin/agents', icon: '' },
      { label: 'Applications', href: '/admin/agents?status=PENDING', icon: '', badge: '', badgeColor: '#ffc107' },
      { label: 'Active Agents', href: '/admin/agents?status=ACTIVE', icon: '' },
    ],
  },
  {
    label: 'Service Requests',
    href: '/admin/requests',
    icon: '📝',
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: '📦',
  },
  {
    label: 'Gigs',
    href: '/admin/gigs',
    icon: '💼',
  },
  {
    label: 'Trust Badges',
    href: '/admin/badges',
    icon: '🛡️',
    children: [
      { label: 'Badge Requests', href: '/admin/badges/requests', icon: '', badge: '', badgeColor: '#ffc107' },
      { label: 'Badge Settings', href: '/admin/badges', icon: '' },
      { label: 'Document Types', href: '/admin/document-types', icon: '' },
    ],
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: '🚨',
    badge: '',
    badgeColor: '#dc3545',
  },
  {
    label: 'Disputes',
    href: '/admin/disputes',
    icon: '⚖️',
    badge: '',
    badgeColor: '#dc3545',
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: '📂',
  },
  {
    label: 'Neighborhoods',
    href: '/admin/neighborhoods',
    icon: '🗺️',
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: '📈',
  },
  {
    label: 'Email Templates',
    href: '/admin/email-templates',
    icon: '📧',
  },
  {
    label: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: '📜',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: '⚙️',
  },
];
