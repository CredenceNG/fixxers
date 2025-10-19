'use client';

/**
 * Badge Document Upload Component
 * 
 * Allows fixers to upload documents (images or PDFs) for badge verification
 */

import { useState } from 'react';
import { uploadFiles } from '@/lib/uploadthing';
import { X } from 'lucide-react';

interface DocumentUploadProps {
    documentType: string;
    label: string;
    onUpload: (file: { url: string; name: string; type: string }) => void;
    currentFile?: { url: string; name: string; type: string } | null;
    onRemove?: () => void;
}

export function BadgeDocumentUpload({
    documentType,
    label,
    onUpload,
    currentFile,
    onRemove,
}: DocumentUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError('');

        console.log('[BadgeDocumentUpload] selected file for', documentType, file.name, file.type, file.size);

        try {
            // Use uploadFiles - simpler and more reliable than createUpload
            console.log('[BadgeDocumentUpload] starting upload for', documentType);

            const uploadedFiles = await uploadFiles('badgeDocumentUploader', {
                files: [file],
            });

            console.log('[BadgeDocumentUpload] upload complete for', documentType, uploadedFiles);

            if (uploadedFiles && uploadedFiles.length > 0) {
                const uploadedFile = uploadedFiles[0];

                // Get the URL and name from the uploaded file
                const url = uploadedFile.url;
                const name = uploadedFile.name || file.name;

                console.log('[BadgeDocumentUpload] parsed uploaded file for', documentType, { url, name });

                if (url && name) {
                    onUpload({ url, name, type: file.type });
                } else {
                    console.error('[BadgeDocumentUpload] missing url or name in upload result', uploadedFile);
                    throw new Error('Upload completed but file URL is missing');
                }
            } else {
                console.error('[BadgeDocumentUpload] no files in upload result');
                throw new Error('Upload completed but no files returned');
            }
        } catch (error: any) {
            console.error('[BadgeDocumentUpload] Upload error:', error);
            setUploadError(error.message || 'Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-600 mt-1">
                        Upload a clear photo or PDF of your document (max 8MB)
                    </p>

                    {currentFile ? (
                        <div className="mt-3 flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex-shrink-0">
                                {currentFile.type.startsWith('image/') ? (
                                    <img
                                        src={currentFile.url}
                                        alt={currentFile.name}
                                        className="h-12 w-12 object-cover rounded"
                                    />
                                ) : (
                                    <div className="h-12 w-12 bg-red-100 rounded flex items-center justify-center">
                                        <span className="text-2xl">📄</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {currentFile.name}
                                </p>
                                <p className="text-xs text-green-600">✓ Uploaded</p>
                            </div>
                            {onRemove && (
                                <button
                                    type="button"
                                    onClick={onRemove}
                                    className="flex-shrink-0 text-red-600 hover:text-red-700"
                                    title="Remove file"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="mt-3">
                            {uploadError && (
                                <p className="text-sm text-red-600 mb-2">{uploadError}</p>
                            )}

                            <label className="block">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-lg file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100
                                        disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </label>

                            {isUploading && (
                                <p className="text-sm text-blue-600 mt-2">Uploading...</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
