import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import BadgePaymentClient from './client';

interface PageProps {
    params: Promise<{
        requestId: string;
    }>;
}

export default async function Page({ params }: PageProps) {
    const { requestId } = await params;

    return (
        <DashboardLayoutWithHeader title="Badge Payment" subtitle={`Request ${requestId}`}>
            <div className="px-6 py-8">
                <div className="max-w-3xl mx-auto">
                    {/* Client handles the interactive payment flow */}
                    <BadgePaymentClient requestId={requestId} />
                </div>
            </div>
        </DashboardLayoutWithHeader>
    );
}

