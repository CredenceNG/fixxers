"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadFiles } from "@/lib/uploadthing";
import { X, Upload, Image as ImageIcon } from "lucide-react";

interface ReviewPhotoUploadProps {
    value: string[];
    onChange: (urls: string[]) => void;
    maxFiles?: number;
}

export default function ReviewPhotoUpload({
    value = [],
    onChange,
    maxFiles = 5,
}: ReviewPhotoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (value.length + acceptedFiles.length > maxFiles) {
                alert(`You can only upload up to ${maxFiles} photos`);
                return;
            }

            setUploading(true);
            setUploadProgress(0);

            try {
                const uploadedFiles = await uploadFiles("reviewImageUploader", {
                    files: acceptedFiles,
                    onUploadProgress: ({ progress }) => {
                        setUploadProgress(progress);
                    },
                });

                const urls = uploadedFiles.map((file) => file.url);
                onChange([...value, ...urls]);
            } catch (error) {
                console.error("Upload error:", error);
                alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            } finally {
                setUploading(false);
                setUploadProgress(0);
            }
        },
        [value, maxFiles, onChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
        },
        maxFiles: maxFiles - value.length,
        maxSize: 4 * 1024 * 1024, // 4MB
        disabled: uploading || value.length >= maxFiles,
    });

    const removePhoto = (index: number) => {
        const newUrls = value.filter((_, i) => i !== index);
        onChange(newUrls);
    };

    const movePhoto = (fromIndex: number, toIndex: number) => {
        const newUrls = [...value];
        const [removed] = newUrls.splice(fromIndex, 1);
        newUrls.splice(toIndex, 0, removed);
        onChange(newUrls);
    };

    return (
        <div style={{ width: "100%" }}>
            {/* Photo Grid */}
            {value.length > 0 && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                        gap: "12px",
                        marginBottom: "16px",
                    }}
                >
                    {value.map((url, index) => (
                        <div
                            key={url}
                            style={{
                                position: "relative",
                                aspectRatio: "1",
                                borderRadius: "8px",
                                overflow: "hidden",
                                border: "2px solid #e5e7eb",
                                backgroundColor: "#f9fafb",
                            }}
                        >
                            <img
                                src={url}
                                alt={`Review photo ${index + 1}`}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                            <button
                                onClick={() => removePhoto(index)}
                                type="button"
                                style={{
                                    position: "absolute",
                                    top: "4px",
                                    right: "4px",
                                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "24px",
                                    height: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    padding: 0,
                                }}
                            >
                                <X size={16} />
                            </button>
                            {/* Reorder buttons */}
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: "4px",
                                    left: "4px",
                                    right: "4px",
                                    display: "flex",
                                    gap: "4px",
                                }}
                            >
                                {index > 0 && (
                                    <button
                                        onClick={() => movePhoto(index, index - 1)}
                                        type="button"
                                        style={{
                                            flex: 1,
                                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            padding: "2px 4px",
                                            fontSize: "10px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        ←
                                    </button>
                                )}
                                {index < value.length - 1 && (
                                    <button
                                        onClick={() => movePhoto(index, index + 1)}
                                        type="button"
                                        style={{
                                            flex: 1,
                                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            padding: "2px 4px",
                                            fontSize: "10px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        →
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Dropzone */}
            {value.length < maxFiles && (
                <div
                    {...getRootProps()}
                    style={{
                        border: "2px dashed",
                        borderColor: isDragActive ? "#3b82f6" : "#d1d5db",
                        borderRadius: "8px",
                        padding: "32px",
                        textAlign: "center",
                        cursor: uploading ? "not-allowed" : "pointer",
                        backgroundColor: isDragActive ? "#eff6ff" : "#f9fafb",
                        transition: "all 0.2s",
                    }}
                >
                    <input {...getInputProps()} />
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        {uploading ? (
                            <>
                                <Upload size={32} color="#9ca3af" />
                                <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                                    Uploading... {uploadProgress}%
                                </p>
                            </>
                        ) : isDragActive ? (
                            <>
                                <ImageIcon size={32} color="#3b82f6" />
                                <p style={{ margin: 0, fontSize: "14px", color: "#3b82f6" }}>
                                    Drop photos here
                                </p>
                            </>
                        ) : (
                            <>
                                <Upload size={32} color="#9ca3af" />
                                <p style={{ margin: 0, fontSize: "14px", color: "#374151" }}>
                                    <strong>Click to upload</strong> or drag and drop
                                </p>
                                <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                                    JPG, PNG, or WEBP (max 4MB each, {maxFiles - value.length}{" "}
                                    remaining)
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Helper text */}
            <p
                style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#6b7280",
                    textAlign: "center",
                }}
            >
                {value.length} of {maxFiles} photos uploaded
            </p>
        </div>
    );
}
