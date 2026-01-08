"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSwipeable } from "react-swipeable";
import Arrow from "./Arrow";

const Indicator = ({ isActive, onClick, mini = false }) => {
  const size = mini ? "w-[6px] h-[6px]" : "w-[8px] h-[8px]";
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${size} rounded-full bg-white/80 transition-all duration-300 ease-out ${
        isActive ? "scale-100 opacity-100" : "scale-75 opacity-40"
      } cursor-pointer`}
    />
  );
};

const PauseButton = ({ paused, toggle, fullscreen }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      toggle();
    }}
    className={`absolute z-50 rounded-full bg-black/40 p-1 text-white backdrop-blur-sm ${
      fullscreen ? "bottom-6 right-6" : "bottom-2 right-2"
    } scale-90 opacity-0 transition-all delay-200 duration-300 ease-out group-hover:scale-100 group-hover:opacity-100`}
    title={paused ? "Reanudar autoplay" : "Pausar autoplay"}
  >
    {paused ? (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    ) : (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
      </svg>
    )}
  </button>
);

const SlideWrapper = ({
  imageList,
  index,
  setIndex,
  isHovering,
  setIsHovering,
  isManual,
  setIsManual,
  mini = false,
  fullscreen = false,
  autoplayPaused,
  toggleAutoplay,
  hasClickedNext,
  setHasClickedNext,
  onClickImage = () => {},
}) => {
  const [rebound, setRebound] = useState(false);
  const [swipePulse, setSwipePulse] = useState(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSwipePulse(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const enableSwipe = imageList.length > 1;

  const resetAutoplay = () => {
    setIsManual(true);
    setHasClickedNext(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsManual(false);
    }, 5000);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!enableSwipe) return;
      resetAutoplay();
      if (index < imageList.length - 1) {
        setIndex((prev) => prev + 1);
      } else {
        setRebound(true);
        setTimeout(() => setRebound(false), 400);
      }
    },
    onSwipedRight: () => {
      if (!enableSwipe) return;
      resetAutoplay();
      if (index > 0) {
        setIndex((prev) => prev - 1);
      } else {
        setRebound(true);
        setTimeout(() => setRebound(false), 400);
      }
    },
    trackTouch: enableSwipe,
    trackMouse: false,
  });

  const heightClass = mini
    ? "h-[170px]"
    : fullscreen
    ? "h-[90vh]"
    : "h-[480px]";
  const objectFit = fullscreen ? "contain" : "cover";

  return (
    <div
      {...swipeHandlers}
      className={`group relative w-full cursor-pointer overflow-hidden ${
        mini ? "rounded-xl" : ""
      } ${heightClass} ${rebound ? "shake-x" : ""}`}
      onClick={onClickImage}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={() => {
        setIsHovering(true);
        setTimeout(() => setIsHovering(false), 2500);
      }}
    >
      <div className="relative h-full w-full overflow-hidden">
        {isManual ? (
          <div
            className="flex h-full transition-transform duration-150 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {imageList.map((image, i) => (
              <div
                key={`slide-${i}`}
                className={`relative h-full w-full flex-shrink-0 flex-grow-0 overflow-hidden ${
                  mini ? "rounded-xl" : ""
                }`}
              >
                <Image
                  src={image.url}
                  alt={`Slide ${i}`}
                  width={1600}
                  height={900}
                  priority={i === 0}
                  loading={i === 0 ? "eager" : "lazy"}
                  className={`h-full w-full object-${objectFit} ${heightClass} ${
                    mini ? "rounded-xl" : ""
                  }`}
                />
              </div>
            ))}
          </div>
        ) : (
          imageList.map((image, i) => (
            <div
              key={`fade-${i}`}
              className={`absolute inset-0 overflow-hidden transition-opacity duration-700 ease-in-out ${
                mini ? "rounded-xl" : ""
              } ${i === index ? "z-10 opacity-100" : "z-0 opacity-0"}`}
            >
              <Image
                src={image.url}
                alt={`Slide ${i}`}
                width={1600}
                height={900}
                priority={i === 0}
                loading={i === 0 ? "eager" : "lazy"}
                className={`h-full w-full object-${objectFit} ${heightClass} ${
                  mini ? "rounded-xl" : ""
                }`}
              />
            </div>
          ))
        )}
      </div>

      {/* Flechas (solo si hay más de una imagen) */}
      {imageList.length > 1 && (
        <div className="hidden sm:block">
          {index > 0 && (
            <Arrow
              direction="left"
              onClick={() => {
                resetAutoplay();
                setIndex((prev) => Math.max(prev - 1, 0));
              }}
              mini={mini}
              total={imageList.length}
            />
          )}
          {index < imageList.length - 1 && (
            <Arrow
              direction="right"
              onClick={() => {
                resetAutoplay();
                setIndex((prev) => Math.min(prev + 1, imageList.length - 1));
              }}
              mini={mini}
              total={imageList.length}
            />
          )}
        </div>
      )}

      {/* Indicadores solo en sm+ y si hay más de una imagen */}
      {imageList.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-20 hidden -translate-x-1/2 gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
          {imageList.map((_, i) => (
            <Indicator
              key={i}
              isActive={i === index}
              onClick={() => {
                resetAutoplay();
                setIndex(i);
              }}
              mini={mini}
            />
          ))}
        </div>
      )}

      {/* Indicador de "Swipe" solo si hay más de una imagen */}
      {imageList.length > 1 && (
        <div
          className={`absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center sm:hidden ${
            swipePulse ? "animate-pulse" : ""
          }`}
        >
          {index === 0 && (
            <div className="rounded-full bg-black/70 px-3 py-1 text-xs text-white shadow-md">
              Swipe →
            </div>
          )}
          {index === imageList.length - 1 && (
            <div className="rounded-full bg-black/70 px-3 py-1 text-xs text-white shadow-md">
              ← Swipe
            </div>
          )}
          {index > 0 && index < imageList.length - 1 && (
            <div className="rounded-full bg-black/70 px-3 py-1 text-xs text-white shadow-md">
              Swipe →
            </div>
          )}
        </div>
      )}

      <PauseButton
        paused={autoplayPaused}
        toggle={toggleAutoplay}
        fullscreen={fullscreen}
      />
    </div>
  );
};

export default SlideWrapper;
