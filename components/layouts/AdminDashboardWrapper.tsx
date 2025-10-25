import { ReactNode } from 'react';
import AdminLTELayout from '@/components/layouts/AdminLTELayout';
import { adminMenuItems } from '@/lib/navigation/adminMenuItems';

interface AdminDashboardWrapperProps {
  children: ReactNode;
  userName?: string;
  userAvatar?: string;
  pendingBadgeRequests?: number;
  pendingAgentApplications?: number;
  pendingReports?: number;
  activeDisputes?: number;
  pendingContactChanges?: number;
}

export default function AdminDashboardWrapper({
  children,
  userName,
  userAvatar,
  pendingBadgeRequests = 0,
  pendingAgentApplications = 0,
  pendingReports = 0,
  activeDisputes = 0,
  pendingContactChanges = 0,
}: AdminDashboardWrapperProps) {
  // Update menu items with dynamic badges
  const menuItemsWithBadges = adminMenuItems.map((item) => {
    if (item.label === 'Users' && item.children) {
      return {
        ...item,
        children: item.children.map((child) => {
          if (child.label === 'Contact Changes' && pendingContactChanges > 0) {
            return { ...child, badge: String(pendingContactChanges) };
          }
          return child;
        }),
      };
    }
    if (item.label === 'Agents' && item.children) {
      return {
        ...item,
        children: item.children.map((child) => {
          if (child.label === 'Applications' && pendingAgentApplications > 0) {
            return { ...child, badge: String(pendingAgentApplications) };
          }
          return child;
        }),
      };
    }
    if (item.label === 'Trust Badges' && item.children) {
      return {
        ...item,
        children: item.children.map((child) => {
          if (child.label === 'Badge Requests' && pendingBadgeRequests > 0) {
            return { ...child, badge: String(pendingBadgeRequests) };
          }
          return child;
        }),
      };
    }
    if (item.label === 'Reports' && pendingReports > 0) {
      return { ...item, badge: String(pendingReports) };
    }
    if (item.label === 'Disputes' && activeDisputes > 0) {
      return { ...item, badge: String(activeDisputes) };
    }
    return item;
  });

  return (
    <AdminLTELayout
      menuItems={menuItemsWithBadges}
      userName={userName}
      userRole="Administrator"
      userAvatar={userAvatar}
      title="Admin Dashboard"
      logoText="Fixers Admin"
      logoHref="/admin/dashboard"
    >
      {children}
    </AdminLTELayout>
  );
}
