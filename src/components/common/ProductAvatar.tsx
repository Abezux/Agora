import React from 'react';

interface ProductAvatarProps {
  name: string;
  imageUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProductAvatar({
  name,
  imageUrl,
  className = '',
  size = 'md',
}: ProductAvatarProps) {
  const isUrl =
    imageUrl &&
    (imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('data:'));
  const firstLetter = name ? name.trim().charAt(0).toUpperCase() : 'P';

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base rounded-xl',
    lg: 'w-12 h-12 text-lg rounded-2xl',
  };

  if (isUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClasses[size]} object-cover border border-agora-border ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-agora-bg border border-agora-border flex items-center justify-center font-serif font-black text-agora-brass shrink-0 shadow-inner select-none ${className}`}
    >
      {firstLetter}
    </div>
  );
}
