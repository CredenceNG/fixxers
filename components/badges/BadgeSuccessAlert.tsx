'use client';

/**
 * Badge Success Alert
 * Shows success messages for badge-related actions
 */

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function BadgeSuccessAlert() {
    const searchParams = useSearchParams();
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const payment = searchParams.get('payment');
        const success = searchParams.get('success');

        if (payment === 'success') {
            setMessage('✅ Payment successful! Your badge request is now under review.');
            setShow(true);
        } else if (success === 'request_created') {
            setMessage('✅ Badge request created! Please complete payment to proceed.');
            setShow(true);
        }

        if (show) {
            const timer = setTimeout(() => {
                setShow(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, show]);

    if (!show) return null;

    return (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 font-medium">{message}</p>
        </div>
    );
}
