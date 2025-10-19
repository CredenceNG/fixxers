import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { colors } from '@/lib/theme';
import { ReferralCodeDisplay } from '@/components/quick-wins/QuickWinBadges';
import { ShareableReferralLink } from '@/components/quick-wins/ShareableReferralLink';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import Link from 'next/link';

async function getUserReferralData(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            name: true,
            referralCode: true,
            referredUsers: {
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                },
            },
        },
    });

    return user;
}

export default async function ReferralPage() {
    const user = await getCurrentUser();

    if (!user?.id) {
        redirect('/auth/signin?callbackUrl=/settings/referral');
    }

    const userData = await getUserReferralData(user.id);

    if (!userData?.referralCode) {
        return (
            <DashboardLayoutWithHeader
                title="Referral Program"
                subtitle="Share and earn rewards"
                actions={
                    <Link
                        href="/settings"
                        style={{
                            padding: '10px 20px',
                            backgroundColor: colors.textSecondary,
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            textDecoration: 'none'
                        }}
                    >
                        ⚙️ Settings
                    </Link>
                }
            >
                <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                    <div
                        style={{
                            padding: '48px 24px',
                            textAlign: 'center',
                            backgroundColor: colors.bgSecondary,
                            borderRadius: '12px',
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: colors.textPrimary }}>
                            Referral Code Not Available
                        </h2>
                        <p style={{ color: colors.textSecondary }}>
                            Your referral code is being generated. Please check back shortly.
                        </p>
                    </div>
                </div>
            </DashboardLayoutWithHeader>
        );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3010';
    const referralLink = `${baseUrl}/signup?ref=${userData.referralCode}`;
    const referralCount = userData.referredUsers.length;

    return (
        <DashboardLayoutWithHeader
            title="Referral Program"
            subtitle="Share your referral code and earn rewards when friends join!"
            actions={
                <Link
                    href="/settings"
                    style={{
                        padding: '10px 20px',
                        backgroundColor: colors.textSecondary,
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textDecoration: 'none'
                    }}
                >
                    ⚙️ Settings
                </Link>
            }
        >
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                {/* Your Referral Code */}
                <div
                    style={{
                        backgroundColor: colors.bgSecondary,
                        borderRadius: '12px',
                        border: `1px solid ${colors.border}`,
                        padding: '24px',
                        marginBottom: '24px',
                    }}
                >
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: colors.textPrimary }}>
                        Your Referral Code
                    </h2>
                    <ReferralCodeDisplay code={userData.referralCode} />
                </div>

                {/* Shareable Link */}
                <ShareableReferralLink referralLink={referralLink} />

                {/* Social Sharing Section */}
                <div
                    style={{
                        backgroundColor: colors.bgSecondary,
                        borderRadius: '12px',
                        border: `1px solid ${colors.border}`,
                        padding: '24px',
                        marginBottom: '24px',
                    }}
                >
                    <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '12px' }}>
                        Or share directly:
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {/* WhatsApp */}
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Join Fixers and find trusted professionals! Use my referral code: ${userData.referralCode}\n${referralLink}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                backgroundColor: '#25D366',
                                color: '#FFFFFF',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                textDecoration: 'none',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            WhatsApp
                        </a>

                        {/* Twitter/X */}
                        <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join Fixers and find trusted professionals! Use my code: ${userData.referralCode}`)}&url=${encodeURIComponent(referralLink)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                backgroundColor: '#1DA1F2',
                                color: '#FFFFFF',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                textDecoration: 'none',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                            Twitter
                        </a>

                        {/* Email */}
                        <a
                            href={`mailto:?subject=${encodeURIComponent('Join Fixers!')}&body=${encodeURIComponent(`I've been using Fixers to find trusted professionals and thought you might like it too!\n\nUse my referral code: ${userData.referralCode}\nSign up here: ${referralLink}`)}`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                backgroundColor: colors.textTertiary,
                                color: '#FFFFFF',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                textDecoration: 'none',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            Email
                        </a>
                    </div>
                </div>

                {/* Referral Stats */}
                <div
                    style={{
                        backgroundColor: colors.bgSecondary,
                        borderRadius: '12px',
                        border: `1px solid ${colors.border}`,
                        padding: '24px',
                    }}
                >
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: colors.textPrimary }}>
                        Your Referrals
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div
                            style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '12px',
                                backgroundColor: colors.primaryLight,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <span style={{ fontSize: '28px', fontWeight: '700', color: colors.primary }}>
                                {referralCount}
                            </span>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                                Total Referrals
                            </p>
                            <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                                {referralCount === 0 ? 'No referrals yet' : `${referralCount} ${referralCount === 1 ? 'person' : 'people'} joined`}
                            </p>
                        </div>
                    </div>

                    {userData.referredUsers.length > 0 ? (
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
                                Recent Referrals:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {userData.referredUsers.slice(0, 5).map((user) => (
                                    <div
                                        key={user.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px',
                                            backgroundColor: colors.bgPrimary,
                                            borderRadius: '8px',
                                            border: `1px solid ${colors.border}`,
                                        }}
                                    >
                                        <span style={{ fontSize: '14px', color: colors.textPrimary }}>
                                            {user.name || 'New User'}
                                        </span>
                                        <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{
                                padding: '24px',
                                textAlign: 'center',
                                backgroundColor: colors.bgPrimary,
                                borderRadius: '8px',
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                                You haven't referred anyone yet. Share your code to get started!
                            </p>
                        </div>
                    )}
                </div>

                {/* How It Works */}
                <div
                    style={{
                        marginTop: '24px',
                        padding: '20px',
                        backgroundColor: colors.primaryLight,
                        borderRadius: '12px',
                        border: `1px solid ${colors.primary}20`,
                    }}
                >
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: colors.textPrimary }}>
                        How It Works
                    </h3>
                    <ol style={{ margin: 0, paddingLeft: '20px', color: colors.textSecondary, fontSize: '14px' }}>
                        <li style={{ marginBottom: '8px' }}>Share your referral code or link with friends</li>
                        <li style={{ marginBottom: '8px' }}>They sign up using your code</li>
                        <li style={{ marginBottom: '8px' }}>You both get rewarded when they join!</li>
                    </ol>
                </div>
            </div>
        </DashboardLayoutWithHeader>
    );
}