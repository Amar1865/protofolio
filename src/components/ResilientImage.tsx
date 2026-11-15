import { Building2 } from 'lucide-react';
import React, { useState } from 'react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className="w-full h-full bg-gradient-to-br from-[#0B1F3A] via-[#132E53] to-[#1E3A5F] flex flex-col items-center justify-center p-8 text-center text-white/90"
        role="img"
        aria-label={alt}
      >
        <Building2 className="w-10 h-10 text-emerald-400 mb-3" />
        <p className="text-sm font-medium text-slate-200 max-w-xs">
          {fallbackTitle || alt}
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
