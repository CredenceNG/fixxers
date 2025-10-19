'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteBadgeRequestButton({ requestId }: { requestId: string }) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');

    async function handleDelete() {
        setDeleting(true);
        setError('');

        try {
            const response = await fetch(`/api/badge-requests/${requestId}/delete`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to badges page
                router.push('/fixer/badges?deleted=true');
            } else {
                setError(data.error || 'Failed to delete request');
                setDeleting(false);
            }
        } catch (err) {
            setError('Failed to delete request');
            setDeleting(false);
        }
    }

    if (!showConfirm) {
        return (
            <button
                onClick={() => setShowConfirm(true)}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
            >
                Delete Request
            </button>
        );
    }

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Confirm Deletion</h3>
            <p className="text-red-700 mb-4">
                Are you sure you want to delete this badge request? This action cannot be undone.
            </p>

            {error && (
                <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                    onClick={() => {
                        setShowConfirm(false);
                        setError('');
                    }}
                    disabled={deleting}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
