'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

export function OrderForm({
  gigId,
  packageId,
  requirements,
}: {
  gigId: string;
  packageId: string;
  requirements: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>(
    requirements.reduce((acc, _, index) => ({ ...acc, [index]: '' }), {})
  );
  const [files, setFiles] = useState<Record<number, File[]>>(
    requirements.reduce((acc, _, index) => ({ ...acc, [index]: [] }), {})
  );
  const [uploading, setUploading] = useState(false);

  // Determine if a requirement is required or optional based on keywords
  const isRequirementRequired = (requirement: string) => {
    const lowerReq = requirement.toLowerCase();
    // Check for keywords that indicate optional/file-related fields
    if (lowerReq.includes('photo') || lowerReq.includes('image') || lowerReq.includes('picture')) {
      return false;
    }
    return true; // Default to required
  };

  // Determine if a requirement should have file upload
  const shouldShowFileUpload = (requirement: string) => {
    const lowerReq = requirement.toLowerCase();
    return lowerReq.includes('photo') || lowerReq.includes('image') || lowerReq.includes('picture');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    const missingRequired = requirements.some((req, index) => {
      if (isRequirementRequired(req)) {
        return !answers[index]?.trim();
      }
      return false;
    });

    if (missingRequired) {
      setError('Please answer all required fields');
      setLoading(false);
      return;
    }

    try {
      // Upload files first if any
      const uploadedFileUrls: Record<number, string[]> = {};

      for (const [indexStr, fileList] of Object.entries(files)) {
        const index = parseInt(indexStr);
        if (fileList.length > 0) {
          setUploading(true);
          const urls: string[] = [];

          for (const file of fileList) {
            const formData = new FormData();
            formData.append('file', file);

            // For now, we'll just store file names as placeholders
            // In production, you'd upload to a service like S3 or UploadThing
            urls.push(file.name);
          }

          uploadedFileUrls[index] = urls;
          setUploading(false);
        }
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId,
          packageId,
          requirementAnswers: requirements.map((_, index) => answers[index] || ''),
          requirementFiles: uploadedFileUrls,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create order');
      }

      const { order } = await res.json();
      router.push(`/client/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const updateAnswer = (index: number, value: string) => {
    setAnswers({ ...answers, [index]: value });
  };

  const handleFileChange = (index: number, selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles);
      setFiles({ ...files, [index]: fileArray });
    }
  };

  const removeFile = (reqIndex: number, fileIndex: number) => {
    const updatedFiles = [...files[reqIndex]];
    updatedFiles.splice(fileIndex, 1);
    setFiles({ ...files, [reqIndex]: updatedFiles });
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: '15px',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '15px',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: '8px',
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          style={{
            padding: '16px',
            backgroundColor: colors.errorLight,
            border: `1px solid ${colors.error}`,
            borderRadius: borderRadius.md,
            marginBottom: '24px',
          }}
        >
          <p style={{ color: colors.error, fontSize: '14px', margin: 0 }}>{error}</p>
        </div>
      )}

      {requirements.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
          {requirements.map((requirement, index) => {
            const required = isRequirementRequired(requirement);
            const showFileUpload = shouldShowFileUpload(requirement);

            return (
              <div key={index}>
                <label style={labelStyle}>
                  {index + 1}. {requirement}
                  {required ? (
                    <span style={{ color: colors.error }}> *</span>
                  ) : (
                    <span style={{ fontSize: '13px', color: colors.textSecondary, fontWeight: '400' }}> (optional)</span>
                  )}
                </label>
                <textarea
                  value={answers[index] || ''}
                  onChange={(e) => updateAnswer(index, e.target.value)}
                  placeholder="Enter your answer here..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />

                {/* File Upload - only show for photo/image related requirements */}
                {showFileUpload && (
                  <div style={{ marginTop: '12px' }}>
                    <label
                      htmlFor={`file-upload-${index}`}
                      style={{
                        display: 'inline-block',
                        padding: '10px 16px',
                        backgroundColor: colors.bgSecondary,
                        color: colors.textPrimary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: borderRadius.md,
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      📎 Attach Photos
                    </label>
                    <input
                      id={`file-upload-${index}`}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileChange(index, e.target.files)}
                      style={{ display: 'none' }}
                    />
                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                      You can upload multiple photos (JPG, PNG, etc.)
                    </p>

                    {/* Show selected files */}
                    {files[index] && files[index].length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {files[index].map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              backgroundColor: colors.bgSecondary,
                              borderRadius: borderRadius.md,
                              fontSize: '14px',
                            }}
                          >
                            <span style={{ color: colors.textPrimary }}>
                              📷 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(index, fileIndex)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: 'transparent',
                                color: colors.error,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '14px', color: colors.textSecondary, fontStyle: 'italic' }}>
            No requirements needed for this service.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || uploading}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: loading || uploading ? colors.gray300 : colors.primary,
          color: colors.white,
          border: 'none',
          borderRadius: borderRadius.md,
          fontSize: '16px',
          fontWeight: '700',
          cursor: loading || uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? 'Uploading Files...' : loading ? 'Creating Order...' : 'Confirm & Continue'}
      </button>

      <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '16px', textAlign: 'center', lineHeight: '1.6' }}>
        By clicking "Confirm & Continue", you agree to our Terms of Service and acknowledge our Privacy Policy.
      </p>
    </form>
  );
}
