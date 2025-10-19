import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import SettingsForm from './SettingsForm';

export default function SettingsPage() {
  return (
    <DashboardLayoutWithHeader
      title="Settings"
      subtitle="Manage your notification preferences and account settings"
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <SettingsForm />
      </div>
    </DashboardLayoutWithHeader>
  );
}
