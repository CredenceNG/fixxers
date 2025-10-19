"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ReviewPhotoGalleryProps {
    photos: string[];
    alt?: string;
}

export default function ReviewPhotoGallery({
    photos,
    alt = "Review photo",
}: ReviewPhotoGalleryProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!photos || photos.length === 0) {
        return null;
    }

    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") goToPrevious();
        if (e.key === "ArrowRight") goToNext();
    };

    return (
        <>
            {/* Photo Grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        photos.length === 1
                            ? "1fr"
                            : photos.length === 2
                                ? "repeat(2, 1fr)"
                                : "repeat(3, 1fr)",
                    gap: "8px",
                    marginTop: "12px",
                }}
            >
                {photos.map((photo, index) => (
                    <div
                        key={photo}
                        onClick={() => openLightbox(index)}
                        style={{
                            position: "relative",
                            aspectRatio: "1",
                            borderRadius: "8px",
                            overflow: "hidden",
                            cursor: "pointer",
                            border: "1px solid #e5e7eb",
                            backgroundColor: "#f9fafb",
                        }}
                    >
                        <img
                            src={photo}
                            alt={`${alt} ${index + 1}`}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transition: "transform 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        />
                        {/* Photo counter badge */}
                        {photos.length > 1 && (
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: "8px",
                                    right: "8px",
                                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                                    color: "white",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                }}
                            >
                                {index + 1} / {photos.length}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox Modal */}
            {lightboxOpen && (
                <div
                    onClick={closeLightbox}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    role="button"
                    aria-label="Close lightbox"
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.95)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={closeLightbox}
                        style={{
                            position: "absolute",
                            top: "20px",
                            right: "20px",
                            backgroundColor: "rgba(255, 255, 255, 0.2)",
                            border: "none",
                            borderRadius: "50%",
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "white",
                            transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                        }}
                    >
                        <X size={24} />
                    </button>

                    {/* Main image */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: "relative",
                            maxWidth: "90vw",
                            maxHeight: "90vh",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <img
                            src={photos[currentIndex]}
                            alt={`${alt} ${currentIndex + 1}`}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "90vh",
                                objectFit: "contain",
                                borderRadius: "8px",
                            }}
                        />

                        {/* Navigation buttons */}
                        {photos.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goToPrevious();
                                    }}
                                    style={{
                                        position: "absolute",
                                        left: "-60px",
                                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "48px",
                                        height: "48px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        color: "white",
                                        transition: "background-color 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            "rgba(255, 255, 255, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            "rgba(255, 255, 255, 0.2)";
                                    }}
                                >
                                    <ChevronLeft size={28} />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goToNext();
                                    }}
                                    style={{
                                        position: "absolute",
                                        right: "-60px",
                                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "48px",
                                        height: "48px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        color: "white",
                                        transition: "background-color 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            "rgba(255, 255, 255, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            "rgba(255, 255, 255, 0.2)";
                                    }}
                                >
                                    <ChevronRight size={28} />
                                </button>
                            </>
                        )}

                        {/* Image counter */}
                        <div
                            style={{
                                position: "absolute",
                                bottom: "-40px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                color: "white",
                                padding: "8px 16px",
                                borderRadius: "20px",
                                fontSize: "14px",
                                fontWeight: 500,
                            }}
                        >
                            {currentIndex + 1} / {photos.length}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
