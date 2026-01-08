"use client";

import React, { useState, useEffect, useRef } from "react";
import SlideWrapper from "../(protected)/view-listing/_components/SlideWrapper";
import useAutoplay from "@/utils/useAutoplay";

function Slider({
  imageList = [],
  disableFullscreen = false,
  mini = false,
  onClickSlider,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const [isHovering, setIsHovering] = useState(false);
  const [isHoveringFullscreen, setIsHoveringFullscreen] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [isManualFullscreen, setIsManualFullscreen] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  const [hasClickedNext, setHasClickedNext] = useState(false);
  const [hasClickedNextFullscreen, setHasClickedNextFullscreen] =
    useState(false);

  const overlayRef = useRef(null);

  const nextIndex = (index) => (index + 1) % imageList.length;

  // Autoplay para slider principal
  useAutoplay(isHovering, isAutoplayPaused, () => {
    setIsManual(false);
    setCurrentIndex((prev) => nextIndex(prev));
  });

  // Autoplay para fullscreen
  useAutoplay(isHoveringFullscreen, isAutoplayPaused, () => {
    setIsManualFullscreen(false);
    setFullscreenIndex((prev) => nextIndex(prev));
  });

  const handleImageClick = () => {
    if (mini && onClickSlider) {
      onClickSlider();
    } else if (!disableFullscreen) {
      setFullscreenIndex(currentIndex);
      setIsManualFullscreen(true);
      setFullscreen(true);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) setFullscreen(false);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      {/* Slider normal */}
      <div onClick={handleImageClick}>
        <SlideWrapper
          imageList={imageList}
          index={currentIndex}
          setIndex={setCurrentIndex}
          isHovering={isHovering}
          setIsHovering={setIsHovering}
          isManual={isManual}
          setIsManual={setIsManual}
          mini={mini}
          fullscreen={false}
          autoplayPaused={isAutoplayPaused}
          toggleAutoplay={() => setIsAutoplayPaused((p) => !p)}
          hasClickedNext={hasClickedNext}
          setHasClickedNext={setHasClickedNext}
          onClickImage={() => {
            if (!disableFullscreen) {
              setFullscreenIndex(currentIndex);
              setIsManualFullscreen(true);
              setFullscreen(true);
            }
          }}
        />
      </div>

      {/* Fullscreen modal */}
      {fullscreen && !disableFullscreen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        >
          <div
            className="group w-full max-w-6xl"
            onMouseEnter={() => setIsHoveringFullscreen(true)}
            onMouseLeave={() => setIsHoveringFullscreen(false)}
            onTouchStart={() => {
              setIsHoveringFullscreen(true);
              setTimeout(() => setIsHoveringFullscreen(false), 2500);
            }}
          >
            <button
              className="absolute right-6 top-6 z-50 text-white"
              onClick={() => setFullscreen(false)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <SlideWrapper
              imageList={imageList}
              index={fullscreenIndex}
              setIndex={setFullscreenIndex}
              isHovering={isHoveringFullscreen}
              setIsHovering={setIsHoveringFullscreen}
              isManual={isManualFullscreen}
              setIsManual={setIsManualFullscreen}
              mini={false}
              fullscreen={true}
              autoplayPaused={isAutoplayPaused}
              toggleAutoplay={() => setIsAutoplayPaused((p) => !p)}
              hasClickedNext={hasClickedNextFullscreen}
              setHasClickedNext={setHasClickedNextFullscreen}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Slider;
