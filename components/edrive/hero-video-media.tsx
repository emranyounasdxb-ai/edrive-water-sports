import Image from 'next/image';

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
  return (
    <>
      <Image
        src={fallbackImage}
        alt={fallbackAlt}
        fill
        priority={priority}
        data-public-hero-image
        className={`object-cover ${objectPosition}`}
        sizes="100vw"
      />
      <video
        data-public-hero-video
        className={`absolute inset-0 size-full object-cover ${objectPosition}`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={fallbackImage}
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
      >
        <source src={publicHeroVideoPath} type="video/mp4" />
      </video>
    </>
  );
}
