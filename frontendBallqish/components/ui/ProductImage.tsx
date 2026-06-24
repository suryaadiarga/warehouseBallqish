import { resolveApiAssetUrl } from '@/lib/api';
import Image from 'next/image';

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

export function ProductImage({ src, alt, className = '' }: ProductImageProps) {
  return (
    <div className={`relative overflow-hidden bg-slate-50 ${className}`}>
      <Image
        src={resolveApiAssetUrl(src)}
        alt={alt}
        fill
        unoptimized
        sizes="(max-width: 768px) 96px, 144px"
        className="object-cover"
        onError={(event) => {
          event.currentTarget.src = resolveApiAssetUrl(null);
        }}
      />
    </div>
  );
}
