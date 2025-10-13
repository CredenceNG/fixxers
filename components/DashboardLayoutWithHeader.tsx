import React from 'react';
import Header from './Header';
import { DashboardLayout } from './DashboardLayout';

interface DashboardLayoutWithHeaderProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function DashboardLayoutWithHeader({
  children,
  title,
  subtitle,
  actions,
}: DashboardLayoutWithHeaderProps) {
  return (
    <>
      <Header />
      <DashboardLayout title={title} subtitle={subtitle} actions={actions}>
        {children}
      </DashboardLayout>
    </>
  );
}
