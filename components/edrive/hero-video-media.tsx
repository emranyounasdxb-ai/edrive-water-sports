'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export const publicHeroVideoPath = '/videos/edrive-hero-loop.mp4';

export function HeroVideoMedia({
  fallbackImage,
  fallbackAlt,
  priority = false,
  objectPosition = 'object-center'
}: {
  fallbackImage: string;
  fallbackAlt: string;
  priority?: boolean;
  objectPosition?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const markVideoReady = () => {
    if (videoRef.current?.error) return;
    setVideoReady(true);
    setVideoFailed(false);
  };

  const showFallbackImage = () => {
    setVideoReady(false);
    setVideoFailed(true);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateMotionPreference = () => {
      const shouldReduceMotion = mediaQuery.matches;
      setPrefersReducedMotion(shouldReduceMotion);

      if (shouldReduceMotion) {
        video.pause();
        return;
      }

      if (video.error) {
        setVideoReady(false);
        setVideoFailed(true);
        return;
      }

      if (video.readyState >= 2) {
        setVideoReady(true);
        setVideoFailed(false);
      }

      void video.play().catch(() => {
        if (video.readyState >= 2 && !video.error) {
          setVideoReady(true);
          setVideoFailed(false);
        }
      });
    };

    updateMotionPreference();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMotionPreference);
      return () => mediaQuery.removeEventListener('change', updateMotionPreference);
    }

    mediaQuery.addListener(updateMotionPreference);
    return () => mediaQuery.removeListener(updateMotionPreference);
  }, []);

  const showFallback = videoFailed || prefersReducedMotion;
  const fallbackPriority = priority && showFallback;
  const showVideo = videoReady && !showFallback;

  return (
    <>
      <Image
        src={fallbackImage}
        alt={fallbackAlt}
        fill
        priority={fallbackPriority}
        hidden={!showFallback}
        aria-hidden={!showFallback}
        data-public-hero-image
        data-video-fallback={showFallback ? 'visible' : 'hidden'}
        className={`object-cover ${objectPosition}`}
        style={{ visibility: showFallback ? 'visible' : 'hidden' }}
        sizes="100vw"
      />
      <video
        ref={videoRef}
        data-public-hero-video
        data-video-ready={showVideo ? 'true' : 'false'}
        className={`absolute inset-0 size-full object-cover ${objectPosition}`}
        style={{ visibility: showVideo ? 'visible' : 'hidden' }}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        disableRemotePlayback
        onLoadedData={markVideoReady}
        onCanPlay={markVideoReady}
        onPlaying={markVideoReady}
        onError={showFallbackImage}
      >
        <source src={publicHeroVideoPath} type="video/mp4" />
      </video>
    </>
  );
}
