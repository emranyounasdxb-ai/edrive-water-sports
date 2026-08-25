'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export const publicHeroVideoPath = '/videos/edrive-hero-loop.mp4';

export function HeroVideoMedia({
  fallbackImage,
  fallbackAlt,
  priority = false,
  objectPosition = 'object-center',
  mediaClassName = ''
}: {
  fallbackImage: string;
  fallbackAlt: string;
  priority?: boolean;
  objectPosition?: string;
  mediaClassName?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadVideo, setLoadVideo] = useState(false);
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
    let idleHandle: number | undefined;
    let timerHandle: ReturnType<typeof setTimeout> | undefined;
    const idleWindow = window as Window & {
      requestIdleCallback?: Window['requestIdleCallback'];
      cancelIdleCallback?: Window['cancelIdleCallback'];
    };

    const scheduleVideo = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (typeof idleWindow.requestIdleCallback === 'function') {
        idleHandle = idleWindow.requestIdleCallback(() => setLoadVideo(true), { timeout: 1400 });
        return;
      }
      timerHandle = setTimeout(() => setLoadVideo(true), 600);
    };

    if (document.readyState === 'complete') scheduleVideo();
    else window.addEventListener('load', scheduleVideo, { once: true });

    return () => {
      window.removeEventListener('load', scheduleVideo);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timerHandle !== undefined) clearTimeout(timerHandle);
    };
  }, []);

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

      if (!loadVideo) return;

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
  }, [loadVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !loadVideo || prefersReducedMotion) return;
    video.load();
    void video.play().catch(() => undefined);
  }, [loadVideo, prefersReducedMotion]);

  const showFallback = !videoReady || videoFailed || prefersReducedMotion;
  const showVideo = videoReady && !videoFailed && !prefersReducedMotion;

  return (
    <>
      <Image
        src={fallbackImage}
        alt={fallbackAlt}
        fill
        priority={priority}
        data-public-hero-image
        data-video-fallback={showFallback ? 'visible' : 'hidden'}
        className={`object-cover ${objectPosition} ${mediaClassName}`}
        sizes="100vw"
      />
      <video
        ref={videoRef}
        data-public-hero-video
        data-video-ready={showVideo ? 'true' : 'false'}
        className={`absolute inset-0 size-full object-cover ${objectPosition} ${mediaClassName}`}
        style={{ visibility: videoFailed || prefersReducedMotion ? 'hidden' : 'visible' }}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={fallbackImage}
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
        disableRemotePlayback
        onLoadedData={markVideoReady}
        onCanPlay={markVideoReady}
        onPlaying={markVideoReady}
        onError={showFallbackImage}
      >
        {loadVideo ? <source src={publicHeroVideoPath} type="video/mp4" /> : null}
      </video>
    </>
  );
}
