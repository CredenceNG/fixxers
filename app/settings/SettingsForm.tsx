'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { styles, colors } from '@/lib/theme';
import toast from 'react-hot-toast';

export default function SettingsForm() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [settings, setSettings] = useState({
        emailNotifications: true,
        smsNotifications: false,
    });
    const [userInfo, setUserInfo] = useState<{
        email?: string;
        phone?: string;
        pendingEmail?: string;
        pendingPhone?: string;
        emailChangeRequested: boolean;
        phoneChangeRequested: boolean;
    } | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactForm, setContactForm] = useState({
        newEmail: '',
        newPhone: '',
    });
    const [contactLoading, setContactLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

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
        // Fetch current settings and user info
        Promise.all([
            fetch('/api/settings').then(res => res.json()),
            fetch('/api/user/info').then(res => res.json()),
        ])
            .then(([settingsData, userInfoData]) => {
                if (settingsData.emailNotifications !== undefined) {
                    setSettings(settingsData);
                }
                if (userInfoData.email !== undefined) {
                    setUserInfo(userInfoData);
                }
            })
            .catch(err => {
                console.error('Failed to fetch data:', err);
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

    const handleContactUpdate = async () => {
        if (!contactForm.newEmail && !contactForm.newPhone) {
            toast.error('Please provide at least one contact detail to update');
            return;
        }

        setContactLoading(true);
        try {
            const response = await fetch('/api/settings/update-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                setShowContactModal(false);
                setContactForm({ newEmail: '', newPhone: '' });
                // Redirect to pending page
                router.push('/pending');
            } else {
                toast.error(data.error || 'Failed to update contact information');
            }
        } catch (error) {
            console.error('Error updating contact:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setContactLoading(false);
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
        <>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '48px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', marginBottom: '24px' }}>
            <h1 style={{ ...styles.headerTitle, margin: '0 0 8px 0' }}>
                Contact Information
            </h1>
            <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '32px' }}>
                Manage your email and phone number. Changes require admin approval.
            </p>

            {/* Email */}
            <div style={{
                padding: '24px',
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                marginBottom: '20px',
                backgroundColor: colors.bgSecondary
            }}>
                <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '6px' }}>
                        📧 Email
                    </h3>
                    <p style={{ fontSize: '16px', color: colors.textPrimary, margin: 0 }}>
                        {userInfo?.email || 'Not set'}
                    </p>
                    {userInfo?.emailChangeRequested && userInfo?.pendingEmail && (
                        <p style={{ fontSize: '14px', color: colors.warning, marginTop: '8px', fontWeight: '600' }}>
                            ⏳ Pending change: {userInfo.pendingEmail}
                        </p>
                    )}
                </div>
            </div>

            {/* Phone */}
            <div style={{
                padding: '24px',
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                marginBottom: '32px',
                backgroundColor: colors.bgSecondary
            }}>
                <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '6px' }}>
                        📱 Phone Number
                    </h3>
                    <p style={{ fontSize: '16px', color: colors.textPrimary, margin: 0 }}>
                        {userInfo?.phone || 'Not set'}
                    </p>
                    {userInfo?.phoneChangeRequested && userInfo?.pendingPhone && (
                        <p style={{ fontSize: '14px', color: colors.warning, marginTop: '8px', fontWeight: '600' }}>
                            ⏳ Pending change: {userInfo.pendingPhone}
                        </p>
                    )}
                </div>
            </div>

            {/* Update Button */}
            <button
                type="button"
                onClick={() => setShowContactModal(true)}
                disabled={userInfo?.emailChangeRequested || userInfo?.phoneChangeRequested}
                style={{
                    ...styles.buttonPrimary,
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    cursor: (userInfo?.emailChangeRequested || userInfo?.phoneChangeRequested) ? 'not-allowed' : 'pointer',
                    opacity: (userInfo?.emailChangeRequested || userInfo?.phoneChangeRequested) ? 0.6 : 1,
                }}
            >
                {(userInfo?.emailChangeRequested || userInfo?.phoneChangeRequested) ? 'Change Pending Approval' : 'Update Contact Information'}
            </button>

            {/* Info Box */}
            <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#FEF5E7',
                border: `1px solid #F5B041`,
                borderRadius: '12px'
            }}>
                <p style={{ fontSize: '13px', color: '#7D6608', margin: 0, lineHeight: '1.6' }}>
                    ⚠️ <strong>Important:</strong> Any changes to your email or phone number require admin approval.
                    You will not be able to access your account while the change is pending.
                </p>
            </div>
        </div>

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

        {/* Contact Update Modal */}
        {showContactModal && (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }} onClick={() => setShowContactModal(false)}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '500px',
                    width: '100%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }} onClick={(e) => e.stopPropagation()}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: colors.textPrimary }}>
                        Update Contact Information
                    </h2>
                    <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '24px' }}>
                        Changes require admin approval and will temporarily restrict account access.
                    </p>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                            New Email (optional)
                        </label>
                        <input
                            type="email"
                            value={contactForm.newEmail}
                            onChange={(e) => setContactForm({ ...contactForm, newEmail: e.target.value })}
                            placeholder={userInfo?.email || 'Enter new email'}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: `1px solid ${colors.border}`,
                                borderRadius: '8px',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                            New Phone Number (optional)
                        </label>
                        <input
                            type="tel"
                            value={contactForm.newPhone}
                            onChange={(e) => setContactForm({ ...contactForm, newPhone: e.target.value })}
                            placeholder={userInfo?.phone || 'Enter new phone number'}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: `1px solid ${colors.border}`,
                                borderRadius: '8px',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={() => setShowContactModal(false)}
                            disabled={contactLoading}
                            style={{
                                flex: 1,
                                padding: '12px 24px',
                                backgroundColor: 'transparent',
                                color: colors.textSecondary,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: contactLoading ? 'not-allowed' : 'pointer',
                                opacity: contactLoading ? 0.6 : 1
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleContactUpdate}
                            disabled={contactLoading}
                            style={{
                                flex: 1,
                                padding: '12px 24px',
                                backgroundColor: colors.primary,
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: contactLoading ? 'not-allowed' : 'pointer',
                                opacity: contactLoading ? 0.6 : 1
                            }}
                        >
                            {contactLoading ? 'Submitting...' : 'Submit for Approval'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
