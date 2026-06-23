import { resolveApiAssetUrl } from '@/lib/api';
import Image from 'next/image';

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  showIllustrationLabel?: boolean;
};

export function ProductImage({ src, alt, className = '', showIllustrationLabel = false }: ProductImageProps) {
  return (
    <div className={`relative overflow-hidden bg-slate-50 ${className}`}>
      {/* Generated catalog illustrations are intentionally presented as references, not exact SKU photos. */}
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
      {showIllustrationLabel ? (
        <span className="absolute bottom-1.5 left-1.5 rounded-md bg-slate-950/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
          Ilustrasi
        </span>
      ) : null}
    </div>
  );
}
