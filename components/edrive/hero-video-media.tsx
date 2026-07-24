'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export const publicHeroVideoPath = '/videos/edrive-hero-loop.mp4?v=20260724';

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

  const markVideoReady = () => {
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

    if (video.error) {
      showFallbackImage();
      return;
    }

    if (video.readyState >= 2) {
      markVideoReady();
    }

    void video.play().catch(() => {
      if (video.readyState >= 2) markVideoReady();
    });
  }, []);

  const fallbackPriority = priority && videoFailed;

  return (
    <>
      <Image
        src={fallbackImage}
        alt={fallbackAlt}
        fill
        priority={fallbackPriority}
        loading={fallbackPriority ? 'eager' : 'lazy'}
        fetchPriority={fallbackPriority ? 'high' : 'low'}
        data-public-hero-image
        data-video-fallback={videoFailed ? 'visible' : 'hidden'}
        className={`object-cover ${objectPosition}`}
        sizes="100vw"
      />
      <video
        ref={videoRef}
        data-public-hero-video
        data-video-ready={videoReady && !videoFailed ? 'true' : 'false'}
        className={`absolute inset-0 size-full object-cover ${objectPosition}`}
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
