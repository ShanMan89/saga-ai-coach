'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  showSkeleton?: boolean;
  skeletonClassName?: string;
  containerClassName?: string;
  lazy?: boolean;
  onLoadComplete?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.svg',
  showSkeleton = true,
  skeletonClassName,
  containerClassName,
  className,
  lazy = true,
  onLoadComplete,
  onError,
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    setImageSrc(fallbackSrc);
    onError?.();
  };

  // Skeleton component
  const Skeleton = () => (
    <div
      className={cn(
        'animate-pulse bg-gray-300 dark:bg-gray-700 rounded',
        skeletonClassName
      )}
      style={{
        width: props.width || '100%',
        height: props.height || '100%',
        aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined,
      }}
    />
  );

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden', containerClassName)}
    >
      {!isInView && showSkeleton && <Skeleton />}
      
      {isInView && (
        <>
          {isLoading && showSkeleton && (
            <div className="absolute inset-0 z-10">
              <Skeleton />
            </div>
          )}
          
          <Image
            src={imageSrc}
            alt={alt}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            {...props}
          />
          
          {hasError && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <svg
                  className="w-8 h-8 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-gray-500">Image failed to load</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Avatar-specific optimized image
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  fallbackInitials,
  className,
  ...props
}: {
  src?: string;
  alt: string;
  size?: number;
  fallbackInitials?: string;
  className?: string;
} & Omit<OptimizedImageProps, 'width' | 'height'>) {
  const [hasError, setHasError] = useState(!src);

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700',
        className
      )}
      style={{ width: size, height: size }}
    >
      {src && !hasError ? (
        <OptimizedImage
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="rounded-full object-cover"
          onError={() => setHasError(true)}
          priority={size <= 50} // Prioritize small avatars
          {...props}
        />
      ) : (
        <div
          className="flex items-center justify-center w-full h-full text-gray-600 dark:text-gray-300 font-medium"
          style={{ fontSize: size * 0.4 }}
        >
          {fallbackInitials || alt.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

// Gallery-specific optimized image
export function GalleryImage({
  src,
  alt,
  aspectRatio = '1/1',
  className,
  ...props
}: {
  aspectRatio?: string;
} & OptimizedImageProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-300 hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ aspectRatio }}
        {...props}
      />
    </div>
  );
}