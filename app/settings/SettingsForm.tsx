'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { styles, colors } from '@/lib/theme';
import toast from 'react-hot-toast';

export default function SettingsForm() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
    });
    const searchParams = useSearchParams();

    useEffect(() => {
        // Check for unsubscribe success message
        const message = searchParams.get('message');
        const type = searchParams.get('type');

        if (message === 'unsubscribed') {
            if (type === 'email') {
                toast.success('You have been unsubscribed from email notifications');
            } else if (type === 'all') {
                toast.success('You have been unsubscribed from all notifications');
            }
        }
    }, [searchParams]);

    useEffect(() => {
        // Fetch current settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.emailNotifications !== undefined) {
                    setSettings(data);
                }
            })
            .catch(err => {
                console.error('Failed to fetch settings:', err);
                toast.error('Failed to load settings');
            })
            .finally(() => setFetching(false));
    }, []);

    const handleToggle = (field: 'emailNotifications' | 'smsNotifications') => {
        setSettings(prev => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Settings saved successfully');
            } else {
                toast.error(data.error || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ color: colors.textSecondary }}>Loading settings...</p>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '48px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
            <h1 style={{ ...styles.headerTitle, margin: '0 0 8px 0' }}>
                Notification Settings
            </h1>
            <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '32px' }}>
                Manage how you receive notifications about orders, quotes, and other activities.
            </p>

            {/* Email Notifications */}
            <div style={{
                padding: '24px',
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                marginBottom: '20px',
                backgroundColor: colors.bgSecondary
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '6px' }}>
                            📧 Email Notifications
                        </h3>
                        <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
                            Receive email notifications for new orders, quotes, and important updates
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleToggle('emailNotifications')}
                        style={{
                            width: '56px',
                            height: '32px',
                            borderRadius: '16px',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background-color 0.2s',
                            backgroundColor: settings.emailNotifications ? colors.primary : '#E4E6EB',
                        }}
                    >
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '12px',
                            backgroundColor: 'white',
                            position: 'absolute',
                            top: '4px',
                            left: settings.emailNotifications ? '28px' : '4px',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }} />
                    </button>
                </div>
            </div>

            {/* SMS Notifications */}
            <div style={{
                padding: '24px',
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                marginBottom: '32px',
                backgroundColor: colors.bgSecondary
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '6px' }}>
                            📱 SMS Notifications
                        </h3>
                        <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
                            Receive SMS text messages for urgent notifications (Coming soon)
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleToggle('smsNotifications')}
                        disabled
                        style={{
                            width: '56px',
                            height: '32px',
                            borderRadius: '16px',
                            border: 'none',
                            cursor: 'not-allowed',
                            position: 'relative',
                            transition: 'background-color 0.2s',
                            backgroundColor: settings.smsNotifications ? colors.primary : '#E4E6EB',
                            opacity: 0.5,
                        }}
                    >
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '12px',
                            backgroundColor: 'white',
                            position: 'absolute',
                            top: '4px',
                            left: settings.smsNotifications ? '28px' : '4px',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }} />
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                style={{
                    ...styles.buttonPrimary,
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                }}
            >
                {loading ? 'Saving...' : 'Save Settings'}
            </button>

            {/* Info Box */}
            <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#EFF6FF',
                border: `1px solid #BFDBFE`,
                borderRadius: '12px'
            }}>
                <p style={{ fontSize: '13px', color: '#1E40AF', margin: 0, lineHeight: '1.6' }}>
                    💡 <strong>Note:</strong> You'll continue to receive critical notifications (like payment confirmations)
                    regardless of your preferences to ensure important account activity is never missed.
                </p>
            </div>
        </div>
    );
}
