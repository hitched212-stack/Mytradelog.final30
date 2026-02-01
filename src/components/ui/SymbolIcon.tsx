import { cn } from '@/lib/utils';
import { forwardRef, memo } from 'react';

interface SymbolIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface TradingViewIconProps {
  src: string;
  alt: string;
  fallbackIcon: React.ReactNode;
}

// Global cache for loaded images - persists across renders and component instances
const loadedImagesCache = new Set<string>();
const failedImagesCache = new Set<string>();
// Counter for cache busting on failed images during transitions
let cacheVersion = 0;

// Synchronously check if image is cached
const isImageCached = (src: string): boolean => loadedImagesCache.has(src);
const isImageFailed = (src: string): boolean => failedImagesCache.has(src);

// Force reset failed cache on new session to allow retry
export const resetFailedImageCache = (): void => {
  failedImagesCache.clear();
  cacheVersion++;
};

// Preload an image and add to cache (fire and forget - no state updates)
const preloadImage = (src: string): void => {
  if (loadedImagesCache.has(src) || failedImagesCache.has(src)) return;
  
  const img = new Image();
  img.onload = () => {
    loadedImagesCache.add(src);
  };
  img.onerror = () => {
    failedImagesCache.add(src);
  };
  img.src = src;
};

// TradingView CDN icon component with fallback - STATELESS to prevent flashing
// Uses synchronous cache check - no useState, no useEffect for loading
const TradingViewIcon = memo(forwardRef<HTMLImageElement, TradingViewIconProps>(
  function TradingViewIcon({ src, alt, fallbackIcon }, ref) {
    // Synchronously check cache - no state needed
    const isCached = isImageCached(src);
    const hasFailed = isImageFailed(src);
    
    // Start preloading if not in cache (fire and forget)
    if (!isCached && !hasFailed) {
      preloadImage(src);
    }
    
    // If failed, show fallback permanently
    if (hasFailed) {
      return <>{fallbackIcon}</>;
    }
    
    // If cached, show image immediately with no opacity transition
    if (isCached) {
      return (
        <img 
          ref={ref}
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => failedImagesCache.add(src)}
          loading="eager"
        />
      );
    }
    
    // Not yet cached - show image with onLoad/onError handlers
    // Use eager loading and no opacity trick to prevent flash
    return (
      <img 
        ref={ref}
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={() => loadedImagesCache.add(src)}
        onError={() => failedImagesCache.add(src)}
        loading="eager"
      />
    );
  }
));
// TradingView CDN URL generators
const getTradingViewCryptoUrl = (symbol: string) => 
  `https://s3-symbol-logo.tradingview.com/crypto/XTVC${symbol}.svg`;

const getTradingViewCountryUrl = (countryCode: string) => 
  `https://s3-symbol-logo.tradingview.com/country/${countryCode}--big.svg`;

const getTradingViewProviderUrl = (symbol: string) => 
  `https://s3-symbol-logo.tradingview.com/${symbol.toLowerCase()}.svg`;

// Bitcoin - Official BTC logo
const BitcoinIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#F7931A"/>
    <path fill="white" d="M22.5 14.1c.3-2.1-1.3-3.2-3.4-3.9l.7-2.8-1.7-.4-.7 2.8c-.5-.1-.9-.2-1.4-.3l.7-2.8-1.7-.4-.7 2.8c-.4-.1-.8-.2-1.1-.2l-2.4-.6-.5 1.8s1.3.3 1.3.3c.7.2.8.6.8 1l-2 7.9c-.1.3-.3.6-.9.5 0 0-1.3-.3-1.3-.3l-.9 2 2.3.6c.4.1.8.2 1.2.3l-.7 2.9 1.7.4.7-2.8c.5.1.9.2 1.4.3l-.7 2.8 1.7.4.7-2.9c2.9.6 5.1.3 6-2.3.8-2.1 0-3.3-1.5-4.1 1.1-.2 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2.1-4.2 1-5.4.7l1-3.9c1.2.3 5 .9 4.4 3.2zm.6-5.3c-.5 1.9-3.5 1-4.5.7l.9-3.5c1 .3 4.2.7 3.6 2.8z"/>
  </svg>
);

// Ethereum - Official ETH diamond logo
const EthereumIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#627EEA"/>
    <path fill="white" fillOpacity="0.6" d="M16.5 4v8.9l7.5 3.3z"/>
    <path fill="white" d="M16.5 4L9 16.2l7.5-3.3z"/>
    <path fill="white" fillOpacity="0.6" d="M16.5 21.9v6.1l7.5-10.4z"/>
    <path fill="white" d="M16.5 28V22l-7.5-5.4z"/>
    <path fill="white" fillOpacity="0.2" d="M16.5 20.6l7.5-4.4-7.5-3.3z"/>
    <path fill="white" fillOpacity="0.6" d="M9 16.2l7.5 4.4v-6.7z"/>
  </svg>
);

// Gold/XAU - Gold bars icon
const GoldIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#D4A017"/>
    <g fill="white">
      <path d="M7 21h7l-1.5-5H8.5z" opacity="0.9"/>
      <path d="M12.5 21h7l-1.5-5h-4z"/>
      <path d="M18 21h7l-1.5-5h-4z" opacity="0.9"/>
      <path d="M9.5 16h5l-1-4h-3z" opacity="0.85"/>
      <path d="M17.5 16h5l-1-4h-3z" opacity="0.85"/>
      <path d="M13 12h6l-.75-3h-4.5z" opacity="0.8"/>
    </g>
  </svg>
);

// NASDAQ 100 / NQ - Blue circle with "100" (always use this, not TradingView green version)
const NasdaqIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#0096D6"/>
    <text x="16" y="20.5" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif">100</text>
  </svg>
);

// S&P 500 / ES - Red circle with "500"
const SP500Icon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#E31937"/>
    <text x="16" y="20.5" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif">500</text>
  </svg>
);

// US30 / YM / Dow Jones - Blue circle with "30" (TradingView style)
const DowIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#0096D6"/>
    <text x="16" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Arial, sans-serif">30</text>
  </svg>
);

// Individual currency circle icons - clean, no clipPath issues
const EURCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#003399"/>
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => {
      const rad = (angle - 90) * Math.PI / 180;
      const starX = cx + Math.cos(rad) * (r * 0.65);
      const starY = cy + Math.sin(rad) * (r * 0.65);
      return <circle key={i} cx={starX} cy={starY} r={r * 0.08} fill="#FFD700"/>;
    })}
  </g>
);

const GBPCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    {/* Blue background */}
    <circle cx={cx} cy={cy} r={r} fill="#012169"/>
    {/* White diagonal stripes */}
    <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} stroke="white" strokeWidth={r * 0.25}/>
    <line x1={cx + r} y1={cy - r} x2={cx - r} y2={cy + r} stroke="white" strokeWidth={r * 0.25}/>
    {/* Red diagonal stripes (thinner) */}
    <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} stroke="#C8102E" strokeWidth={r * 0.12}/>
    <line x1={cx + r} y1={cy - r} x2={cx - r} y2={cy + r} stroke="#C8102E" strokeWidth={r * 0.12}/>
    {/* White cross (thicker) */}
    <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="white" strokeWidth={r * 0.4}/>
    <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="white" strokeWidth={r * 0.4}/>
    {/* Red cross */}
    <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#C8102E" strokeWidth={r * 0.22}/>
    <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#C8102E" strokeWidth={r * 0.22}/>
  </g>
);

const USDCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    {/* Red background */}
    <circle cx={cx} cy={cy} r={r} fill="#B22234"/>
    {/* White stripes */}
    <rect x={cx - r} y={cy - r * 0.75} width={r * 2} height={r * 0.18} fill="white"/>
    <rect x={cx - r} y={cy - r * 0.39} width={r * 2} height={r * 0.18} fill="white"/>
    <rect x={cx - r} y={cy - r * 0.03} width={r * 2} height={r * 0.18} fill="white"/>
    <rect x={cx - r} y={cy + r * 0.33} width={r * 2} height={r * 0.18} fill="white"/>
    <rect x={cx - r} y={cy + r * 0.69} width={r * 2} height={r * 0.18} fill="white"/>
    {/* Blue canton */}
    <rect x={cx - r} y={cy - r} width={r * 1.1} height={r * 1.05} fill="#3C3B6E"/>
    {/* Stars (simplified as dots) */}
    {[-0.7, -0.35, 0].map((yOffset, row) => 
      [-0.75, -0.45, -0.15].map((xOffset, col) => (
        <circle key={`${row}-${col}`} cx={cx + r * xOffset} cy={cy + r * (yOffset - 0.35)} r={r * 0.07} fill="white"/>
      ))
    )}
  </g>
);

const JPYCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#FFFFFF"/>
    <circle cx={cx} cy={cy} r={r * 0.5} fill="#BC002D"/>
  </g>
);

const CHFCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#FF0000"/>
    <rect x={cx - r * 0.1} y={cy - r * 0.45} width={r * 0.2} height={r * 0.9} fill="white"/>
    <rect x={cx - r * 0.45} y={cy - r * 0.1} width={r * 0.9} height={r * 0.2} fill="white"/>
  </g>
);

const AUDCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#00008B"/>
    <circle cx={cx + r * 0.3} cy={cy - r * 0.35} r={r * 0.1} fill="white"/>
    <circle cx={cx + r * 0.45} cy={cy + r * 0.1} r={r * 0.1} fill="white"/>
    <circle cx={cx + r * 0.2} cy={cy + r * 0.45} r={r * 0.1} fill="white"/>
    <circle cx={cx - r * 0.2} cy={cy + r * 0.1} r={r * 0.08} fill="white"/>
  </g>
);

const CADCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="white"/>
    <rect x={cx - r} y={cy - r} width={r * 0.6} height={r * 2} fill="#FF0000"/>
    <rect x={cx + r * 0.4} y={cy - r} width={r * 0.6} height={r * 2} fill="#FF0000"/>
    <circle cx={cx} cy={cy} r={r * 0.35} fill="#FF0000"/>
  </g>
);

const NZDCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#00247D"/>
    <circle cx={cx + r * 0.25} cy={cy - r * 0.4} r={r * 0.12} fill="#CC142B" stroke="white" strokeWidth={r * 0.03}/>
    <circle cx={cx + r * 0.45} cy={cy + r * 0.05} r={r * 0.12} fill="#CC142B" stroke="white" strokeWidth={r * 0.03}/>
    <circle cx={cx + r * 0.25} cy={cy + r * 0.4} r={r * 0.12} fill="#CC142B" stroke="white" strokeWidth={r * 0.03}/>
    <circle cx={cx - r * 0.1} cy={cy + r * 0.05} r={r * 0.09} fill="#CC142B" stroke="white" strokeWidth={r * 0.025}/>
  </g>
);

const SGDCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#ED2939"/>
    <rect x={cx - r} y={cy} width={r * 2} height={r} fill="white"/>
    <circle cx={cx - r * 0.35} cy={cy - r * 0.25} r={r * 0.3} fill="white"/>
    <circle cx={cx - r * 0.2} cy={cy - r * 0.25} r={r * 0.25} fill="#ED2939"/>
    {[0,72,144,216,288].map((angle, i) => {
      const rad = (angle - 90) * Math.PI / 180;
      const starX = cx + r * 0.2 + Math.cos(rad) * (r * 0.2);
      const starY = cy - r * 0.2 + Math.sin(rad) * (r * 0.2);
      return <circle key={i} cx={starX} cy={starY} r={r * 0.05} fill="white"/>;
    })}
  </g>
);

const HKDCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#DE2910"/>
    {[0,72,144,216,288].map((angle, i) => {
      const rad = (angle - 90) * Math.PI / 180;
      const petalX = cx + Math.cos(rad) * (r * 0.4);
      const petalY = cy + Math.sin(rad) * (r * 0.4);
      return <ellipse key={i} cx={petalX} cy={petalY} rx={r * 0.2} ry={r * 0.12} fill="white" transform={`rotate(${angle}, ${petalX}, ${petalY})`}/>;
    })}
  </g>
);

const CNYCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#DE2910"/>
    <circle cx={cx - r * 0.35} cy={cy - r * 0.25} r={r * 0.25} fill="#FFDE00"/>
    {[30,75,105,150].map((angle, i) => {
      const rad = (angle - 90) * Math.PI / 180;
      const starX = cx + r * 0.1 + Math.cos(rad) * (r * 0.4);
      const starY = cy - r * 0.1 + Math.sin(rad) * (r * 0.4);
      return <circle key={i} cx={starX} cy={starY} r={r * 0.08} fill="#FFDE00"/>;
    })}
  </g>
);

const SEKCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#006AA7"/>
    <rect x={cx - r * 0.85} y={cy - r * 0.12} width={r * 1.7} height={r * 0.24} fill="#FECC00"/>
    <rect x={cx - r * 0.35} y={cy - r * 0.85} width={r * 0.24} height={r * 1.7} fill="#FECC00"/>
  </g>
);

const NOKCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#BA0C2F"/>
    <rect x={cx - r * 0.85} y={cy - r * 0.18} width={r * 1.7} height={r * 0.36} fill="white"/>
    <rect x={cx - r * 0.4} y={cy - r * 0.85} width={r * 0.36} height={r * 1.7} fill="white"/>
    <rect x={cx - r * 0.85} y={cy - r * 0.08} width={r * 1.7} height={r * 0.16} fill="#00205B"/>
    <rect x={cx - r * 0.3} y={cy - r * 0.85} width={r * 0.16} height={r * 1.7} fill="#00205B"/>
  </g>
);

const MXNCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="white"/>
    <rect x={cx - r} y={cy - r} width={r * 0.7} height={r * 2} fill="#006847"/>
    <rect x={cx + r * 0.3} y={cy - r} width={r * 0.7} height={r * 2} fill="#CE1126"/>
    <circle cx={cx} cy={cy} r={r * 0.2} fill="#8B4513"/>
  </g>
);

const ZARCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#007749"/>
    <rect x={cx - r} y={cy - r * 0.5} width={r * 2} height={r * 0.33} fill="white"/>
    <rect x={cx - r} y={cy + r * 0.17} width={r * 2} height={r * 0.33} fill="#DE3831"/>
    <path d={`M${cx - r * 0.7} ${cy} L${cx - r * 0.2} ${cy - r * 0.5} L${cx - r * 0.2} ${cy + r * 0.5} Z`} fill="#FFB612"/>
  </g>
);

const TRYCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#E30A17"/>
    <circle cx={cx - r * 0.1} cy={cy} r={r * 0.45} fill="white"/>
    <circle cx={cx + r * 0.05} cy={cy} r={r * 0.35} fill="#E30A17"/>
    <circle cx={cx + r * 0.35} cy={cy} r={r * 0.12} fill="white"/>
  </g>
);

const PLNCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="white"/>
    <rect x={cx - r} y={cy} width={r * 2} height={r} fill="#DC143C"/>
  </g>
);

const THBCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#A51931"/>
    <rect x={cx - r} y={cy - r * 0.5} width={r * 2} height={r} fill="#2D2A4A"/>
    <rect x={cx - r} y={cy - r * 0.25} width={r * 2} height={r * 0.5} fill="white"/>
  </g>
);

const INRCircle = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="white"/>
    <rect x={cx - r} y={cy - r * 0.9} width={r * 2} height={r * 0.6} fill="#FF9933"/>
    <rect x={cx - r} y={cy + r * 0.3} width={r * 2} height={r * 0.6} fill="#138808"/>
    <circle cx={cx} cy={cy} r={r * 0.2} fill="#000080"/>
  </g>
);

const renderCurrencyCircle = (currency: string, cx: number, cy: number, r: number, clipId: string) => {
  const content = (() => {
    switch (currency) {
      case 'EUR': return <EURCircle cx={cx} cy={cy} r={r} />;
      case 'GBP': return <GBPCircle cx={cx} cy={cy} r={r} />;
      case 'USD': return <USDCircle cx={cx} cy={cy} r={r} />;
      case 'JPY': return <JPYCircle cx={cx} cy={cy} r={r} />;
      case 'CHF': return <CHFCircle cx={cx} cy={cy} r={r} />;
      case 'AUD': return <AUDCircle cx={cx} cy={cy} r={r} />;
      case 'CAD': return <CADCircle cx={cx} cy={cy} r={r} />;
      case 'NZD': return <NZDCircle cx={cx} cy={cy} r={r} />;
      case 'SGD': return <SGDCircle cx={cx} cy={cy} r={r} />;
      case 'HKD': return <HKDCircle cx={cx} cy={cy} r={r} />;
      case 'CNY': case 'CNH': return <CNYCircle cx={cx} cy={cy} r={r} />;
      case 'SEK': return <SEKCircle cx={cx} cy={cy} r={r} />;
      case 'NOK': return <NOKCircle cx={cx} cy={cy} r={r} />;
      case 'MXN': return <MXNCircle cx={cx} cy={cy} r={r} />;
      case 'ZAR': return <ZARCircle cx={cx} cy={cy} r={r} />;
      case 'TRY': return <TRYCircle cx={cx} cy={cy} r={r} />;
      case 'PLN': return <PLNCircle cx={cx} cy={cy} r={r} />;
      case 'THB': return <THBCircle cx={cx} cy={cy} r={r} />;
      case 'INR': return <INRCircle cx={cx} cy={cy} r={r} />;
      default: return (
        <g>
          <circle cx={cx} cy={cy} r={r} fill="#4A5568"/>
          <text x={cx} y={cy + r * 0.15} textAnchor="middle" fill="white" fontSize={r * 0.6} fontWeight="700">{currency}</text>
        </g>
      );
    }
  })();

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {content}
      </g>
    </g>
  );
};

// TradingView country code mapping
const currencyToCountry: Record<string, string> = {
  USD: 'US',
  EUR: 'EU',
  GBP: 'GB',
  JPY: 'JP',
  CHF: 'CH',
  AUD: 'AU',
  CAD: 'CA',
  NZD: 'NZ',
  SGD: 'SG',
  HKD: 'HK',
  CNY: 'CN',
  SEK: 'SE',
  NOK: 'NO',
  MXN: 'MX',
  ZAR: 'ZA',
  TRY: 'TR',
  PLN: 'PL',
  THB: 'TH',
  INR: 'IN',
  RUB: 'RU',
  DKK: 'DK',
  CZK: 'CZ',
  HUF: 'HU',
  BRL: 'BR',
  KRW: 'KR',
  IDR: 'ID',
  MYR: 'MY',
  PHP: 'PH',
  TWD: 'TW',
};

// Cached image component for forex pairs - STATELESS to prevent flash on re-render
const CachedFlagImage = memo(({ src, alt }: { src: string; alt: string }) => {
  // Synchronously check cache - no state needed
  const isCached = isImageCached(src);
  const hasFailed = isImageFailed(src);
  
  // Start preloading if not in cache (fire and forget)
  if (!isCached && !hasFailed) {
    preloadImage(src);
  }
  
  // If failed, show muted placeholder
  if (hasFailed) {
    return <div className="w-full h-full bg-muted rounded-full" />;
  }
  
  // Always render the image - it will show when loaded
  // No conditional rendering based on state = no flashing
  return (
    <img 
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      style={{ display: 'block' }}
      onLoad={() => loadedImagesCache.add(src)}
      onError={() => failedImagesCache.add(src)}
    />
  );
});

const ForexPairIcon = ({ base, quote }: { base: string; quote: string }) => {
  const baseCountry = currencyToCountry[base] || base.substring(0, 2);
  const quoteCountry = currencyToCountry[quote] || quote.substring(0, 2);
  const baseSrc = `https://s3-symbol-logo.tradingview.com/country/${baseCountry}--big.svg`;
  const quoteSrc = `https://s3-symbol-logo.tradingview.com/country/${quoteCountry}--big.svg`;
  
  return (
    <div className="flex items-center w-full h-full">
      {/* Base currency - front, 65% of container */}
      <div 
        className="relative z-10 rounded-full overflow-hidden border-2 border-background flex-shrink-0"
        style={{ 
          width: '65%', 
          aspectRatio: '1 / 1',
        }}
      >
        <CachedFlagImage src={baseSrc} alt={base} />
      </div>
      
      {/* Quote currency - back, overlapping, 55% of container */}
      <div 
        className="relative z-0 rounded-full overflow-hidden border border-background flex-shrink-0"
        style={{ 
          width: '55%', 
          aspectRatio: '1 / 1',
          marginLeft: '-20%'
        }}
      >
        <CachedFlagImage src={quoteSrc} alt={quote} />
      </div>
    </div>
  );
};

// Silver XAG - Silver bars
const SilverIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#A8A9AD"/>
    <g fill="white">
      <path d="M7 21h7l-1.5-5H8.5z" opacity="0.9"/>
      <path d="M12.5 21h7l-1.5-5h-4z"/>
      <path d="M18 21h7l-1.5-5h-4z" opacity="0.9"/>
      <path d="M9.5 16h5l-1-4h-3z" opacity="0.85"/>
      <path d="M17.5 16h5l-1-4h-3z" opacity="0.85"/>
      <path d="M13 12h6l-.75-3h-4.5z" opacity="0.8"/>
    </g>
  </svg>
);

// Oil - Black circle with droplet
const OilIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#1A1A1A"/>
    <path d="M16 7c-4 5-7 9-7 12a7 7 0 1014 0c0-3-3-7-7-12z" fill="#333"/>
    <path d="M14 17c0 2 1.5 3 2.5 3" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

// Solana - Official gradient
const SolanaIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <defs>
      <linearGradient id="solGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#9945FF"/>
        <stop offset="50%" stopColor="#8752F3"/>
        <stop offset="100%" stopColor="#14F195"/>
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="16" fill="url(#solGrad)"/>
    <path d="M9 19.5l2.5-2.5h11l-2.5 2.5H9z" fill="white"/>
    <path d="M9 12.5l2.5 2.5h11l-2.5-2.5H9z" fill="white"/>
    <path d="M9 16l2.5-2h11l-2.5 2H9z" fill="white" opacity="0.8"/>
  </svg>
);

// XRP - Official Ripple logo
const XRPIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#23292F"/>
    <path d="M11 9h2.5l2.5 3 2.5-3H21l-4 5 4 5h-2.5l-2.5-3-2.5 3H11l4-5-4-5z" fill="white"/>
  </svg>
);

// DAX GER40 - German flag colors
const DaxIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <defs>
      <clipPath id="daxCircle">
        <circle cx="16" cy="16" r="16"/>
      </clipPath>
    </defs>
    <g clipPath="url(#daxCircle)">
      <rect y="0" width="32" height="11" fill="#000000"/>
      <rect y="11" width="32" height="10" fill="#DD0000"/>
      <rect y="21" width="32" height="11" fill="#FFCC00"/>
    </g>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif" stroke="#000" strokeWidth="0.5">40</text>
  </svg>
);

// FTSE UK100 - UK flag
const FTSEIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <defs>
      <clipPath id="ftseCircle">
        <circle cx="16" cy="16" r="16"/>
      </clipPath>
    </defs>
    <g clipPath="url(#ftseCircle)">
      <rect width="32" height="32" fill="#012169"/>
      <path d="M0 0l32 32M32 0L0 32" stroke="white" strokeWidth="5"/>
      <path d="M0 0l32 32M32 0L0 32" stroke="#C8102E" strokeWidth="3"/>
      <path d="M16 0v32M0 16h32" stroke="white" strokeWidth="8"/>
      <path d="M16 0v32M0 16h32" stroke="#C8102E" strokeWidth="5"/>
    </g>
  </svg>
);

// Nikkei 225 - Japanese flag with 225
const NikkeiIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#FFFFFF"/>
    <circle cx="16" cy="16" r="9" fill="#BC002D"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">225</text>
  </svg>
);

// USDT Tether
const TetherIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#26A17B"/>
    <path d="M17.8 14.2v-2.7h3.2V9h-10v2.5h3.2v2.7c-4 .2-7 1.2-7 2.4s3 2.2 7 2.4v5.5h3.6V19c4-.2 7-1.2 7-2.4s-3-2.2-7-2.4z" fill="white"/>
  </svg>
);

// Litecoin
const LitecoinIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#345D9D"/>
    <path d="M12.5 8v12M10 18l6-3M18.5 8v16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

// Dogecoin
const DogecoinIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#C2A633"/>
    <text x="16" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Comic Sans MS, Arial, sans-serif">Ð</text>
  </svg>
);

// Cardano
const CardanoIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#0033AD"/>
    {[0,60,120,180,240,300].map((angle, i) => {
      const rad = (angle - 90) * Math.PI / 180;
      const x = 16 + Math.cos(rad) * 8;
      const y = 16 + Math.sin(rad) * 8;
      return <circle key={i} cx={x} cy={y} r={2} fill="white"/>;
    })}
    <circle cx="16" cy="16" r="3" fill="white"/>
  </svg>
);

// Polkadot
const PolkadotIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#E6007A"/>
    <circle cx="16" cy="10" r="4" fill="white"/>
    <circle cx="16" cy="22" r="4" fill="white"/>
    <circle cx="16" cy="16" r="2.5" fill="white"/>
  </svg>
);

// Avalanche
const AvalancheIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#E84142"/>
    <path d="M11 22l5-12 5 12h-3.5l-1.5-4-1.5 4z" fill="white"/>
  </svg>
);

// Chainlink
const ChainlinkIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#2A5ADA"/>
    <path d="M16 8l-6 4v8l6 4 6-4v-8l-6-4zm0 2.5l4 2.5v5l-4 2.5-4-2.5v-5l4-2.5z" fill="white"/>
  </svg>
);

// Polygon MATIC
const PolygonIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#8247E5"/>
    <path d="M20.5 13l-3-1.7-3 1.7v3.5l3 1.7 3-1.7V13zM11.5 16.5l3 1.7 3-1.7v-3.5l-3-1.7-3 1.7v3.5z" fill="white"/>
  </svg>
);

// BNB
const BNBIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
    <path d="M16 8l-2 2 2 2 2-2-2-2zm-5 5l-2 2 2 2 2-2-2-2zm10 0l-2 2 2 2 2-2-2-2zm-5 5l-2 2 2 2 2-2-2-2z" fill="white"/>
  </svg>
);

// Apple
const AppleIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#000000"/>
    <path d="M21.5 23.5c-.8 1.2-1.7 2.4-3 2.4-1.3 0-1.8-.8-3.3-.8s-2 .8-3.2.8c-1.3 0-2.3-1.3-3.1-2.5-1.7-2.4-3-6.8-1.2-9.8.9-1.5 2.4-2.4 4-2.4 1.3 0 2.4.9 3.2.9s2-.9 3.5-.8c.6 0 2.3.2 3.4 1.9-3.1 1.9-2.6 6.8.7 8.3zM18 8c-1.7.1-3.1 1.8-2.9 3.2 1.6.1 3.1-1.5 2.9-3.2z" fill="white"/>
  </svg>
);

// Tesla
const TeslaIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#CC0000"/>
    <path d="M16 7v18M8.5 9h15c0 0-2 3-7.5 3s-7.5-3-7.5-3z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="16" cy="6" r="1.5" fill="white"/>
  </svg>
);

// NVIDIA
const NvidiaIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#76B900"/>
    <path d="M9 12l14 4-14 4V12z" fill="white"/>
  </svg>
);

// Amazon
const AmazonIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#232F3E"/>
    <path d="M7 19c0 0 6 4 11 4s8-2 8-2" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M23 18l3 2.5-3 2.5" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <text x="16" y="15" textAnchor="middle" fill="#FF9900" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">a</text>
  </svg>
);

// Google
const GoogleIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="white"/>
    <path d="M23.5 16.3c0-.8-.1-1.5-.2-2.1H16v4h4.2c-.2 1.1-.8 2-1.6 2.6v2.1h2.6c1.5-1.4 2.3-3.4 2.3-6.6z" fill="#4285F4"/>
    <path d="M16 24c2.2 0 4-.7 5.3-1.9l-2.6-2c-.7.5-1.6.8-2.7.8-2.1 0-3.8-1.4-4.5-3.3H8.8v2.1c1.3 2.6 4 4.3 7.2 4.3z" fill="#34A853"/>
    <path d="M11.5 17.6c-.2-.5-.3-1-.3-1.6s.1-1.1.3-1.6V12.3H8.8C8.3 13.3 8 14.6 8 16s.3 2.7.8 3.7l2.7-2.1z" fill="#FBBC05"/>
    <path d="M16 11c1.2 0 2.2.4 3 1.2l2.3-2.3C19.9 8.7 18.2 8 16 8c-3.2 0-5.9 1.7-7.2 4.3l2.7 2.1c.7-1.9 2.4-3.4 4.5-3.4z" fill="#EA4335"/>
  </svg>
);

// Meta
const MetaIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#0668E1"/>
    <path d="M7 20c0-5 2.5-10 5-10s3.5 4 4.5 7c1-3 2-7 4.5-7s5 5 5 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);

// Microsoft
const MicrosoftIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="white"/>
    <rect x="8" y="8" width="7" height="7" fill="#F25022"/>
    <rect x="17" y="8" width="7" height="7" fill="#7FBA00"/>
    <rect x="8" y="17" width="7" height="7" fill="#00A4EF"/>
    <rect x="17" y="17" width="7" height="7" fill="#FFB900"/>
  </svg>
);

// AMD
const AMDIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#ED1C24"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif">AMD</text>
  </svg>
);

// Intel
const IntelIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#0071C5"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">intel</text>
  </svg>
);

// Netflix
const NetflixIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#000000"/>
    <path d="M11 8h3v16h-3zM18 8h3v16h-3z" fill="#E50914"/>
    <path d="M11 8l7 16h3L14 8h-3z" fill="#E50914"/>
  </svg>
);

// Disney
const DisneyIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#113CCF"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">Disney</text>
  </svg>
);

// PayPal
const PayPalIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#003087"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="6" fontWeight="700" fontFamily="Arial, sans-serif">PayPal</text>
  </svg>
);

// Visa
const VisaIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#1A1F71"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">VISA</text>
  </svg>
);

// Mastercard
const MastercardIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#1A1A1A"/>
    <circle cx="13" cy="16" r="6" fill="#EB001B"/>
    <circle cx="19" cy="16" r="6" fill="#F79E1B"/>
    <ellipse cx="16" cy="16" rx="2" ry="5" fill="#FF5F00"/>
  </svg>
);

// JPMorgan
const JPMorganIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#000000"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">JPM</text>
  </svg>
);

// Bank of America
const BACIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#012169"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">BAC</text>
  </svg>
);

// Goldman Sachs
const GoldmanIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#7399C6"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">GS</text>
  </svg>
);

// Berkshire Hathaway
const BerkshireIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#1E3A5F"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">BRK</text>
  </svg>
);

// Coca-Cola
const CokeIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#F40009"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">KO</text>
  </svg>
);

// Pepsi
const PepsiIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#004B93"/>
    <path d="M4 16a12 12 0 0124 0" fill="#D21034"/>
    <path d="M8 14c4 2 8 2 12 0" fill="white" stroke="white" strokeWidth="2"/>
  </svg>
);

// McDonald's
const McDonaldsIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#FFC72C"/>
    <text x="16" y="22" textAnchor="middle" fill="#DA291C" fontSize="18" fontWeight="700" fontFamily="Arial, sans-serif">M</text>
  </svg>
);

// Starbucks
const StarbucksIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#00704A"/>
    <circle cx="16" cy="16" r="10" fill="none" stroke="white" strokeWidth="1.5"/>
    <circle cx="16" cy="14" r="3" fill="white"/>
    <path d="M13 18c0 3 3 5 3 5s3-2 3-5" fill="white"/>
  </svg>
);

// Nike
const NikeIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#000000"/>
    <path d="M8 18c4-2 8-4 14-6-1 3-5 8-10 8" fill="white"/>
  </svg>
);

// Adidas
const AdidasIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#000000"/>
    <path d="M8 20l4-8 4 8M12 20l4-8 4 8M16 20l4-8 4 8" stroke="white" strokeWidth="2" fill="none"/>
  </svg>
);

// Walmart
const WalmartIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#0071CE"/>
    {[0,60,120,180,240,300].map((angle, i) => {
      const rad = (angle - 90) * Math.PI / 180;
      return <line key={i} x1={16} y1={16} x2={16 + Math.cos(rad) * 8} y2={16 + Math.sin(rad) * 8} stroke="#FFC220" strokeWidth="2.5" strokeLinecap="round"/>;
    })}
  </svg>
);

// Natural Gas
const NatGasIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#4A90D9"/>
    <path d="M16 8c-3 4-5 7-5 10a5 5 0 0010 0c0-3-2-6-5-10z" fill="#7CB9E8"/>
    <path d="M16 12c-2 3-3 5-3 7a3 3 0 006 0c0-2-1-4-3-7z" fill="white" opacity="0.6"/>
  </svg>
);

// Copper
const CopperIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#B87333"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial, sans-serif">Cu</text>
  </svg>
);

// Platinum
const PlatinumIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#E5E4E2"/>
    <text x="16" y="20" textAnchor="middle" fill="#333" fontSize="10" fontWeight="700" fontFamily="Arial, sans-serif">Pt</text>
  </svg>
);

// Palladium
const PalladiumIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#CED0DD"/>
    <text x="16" y="20" textAnchor="middle" fill="#333" fontSize="10" fontWeight="700" fontFamily="Arial, sans-serif">Pd</text>
  </svg>
);

// Wheat
const WheatIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#DEB887"/>
    <path d="M16 8v16M12 12l4 4-4 4M20 12l-4 4 4 4" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);

// Corn
const CornIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#FFD700"/>
    <ellipse cx="16" cy="16" rx="5" ry="9" fill="#F4A460"/>
    <path d="M13 10v12M16 9v14M19 10v12" stroke="#FFD700" strokeWidth="1.5"/>
  </svg>
);

// Coffee
const CoffeeIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#6F4E37"/>
    <path d="M10 12h10v8c0 2-2 4-5 4s-5-2-5-4v-8z" fill="#3C2415"/>
    <path d="M20 14h2c1 0 2 1 2 2s-1 2-2 2h-2" stroke="#3C2415" strokeWidth="2" fill="none"/>
    <path d="M12 10c1-1 2-1 4 0s3 1 4 0" stroke="white" strokeWidth="1" fill="none" opacity="0.5"/>
  </svg>
);

// Sugar
const SugarIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#FFFFFF" stroke="#ddd" strokeWidth="1"/>
    <rect x="10" y="11" width="12" height="10" rx="1" fill="#F5F5F5" stroke="#ddd"/>
    <text x="16" y="19" textAnchor="middle" fill="#666" fontSize="6" fontWeight="700">SUGAR</text>
  </svg>
);

// Russell 2000
const RussellIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#1E3A8A"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">2000</text>
  </svg>
);

// VIX
const VIXIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#FF6B00"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial, sans-serif">VIX</text>
  </svg>
);

// Dollar Index DXY
const DXYIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#2E7D32"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif">DXY</text>
  </svg>
);

// Hang Seng
const HangSengIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#DE2910"/>
    <text x="16" y="20" textAnchor="middle" fill="#FFD700" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">HSI</text>
  </svg>
);

// ASX 200
const ASXIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#00008B"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">200</text>
  </svg>
);

// CAC 40
const CACIcon = () => (
  <svg viewBox="0 0 32 32" className="w-full h-full">
    <circle cx="16" cy="16" r="16" fill="#002395"/>
    <rect x="0" y="0" width="11" height="32" fill="#002395"/>
    <rect x="11" y="0" width="10" height="32" fill="white"/>
    <rect x="21" y="0" width="11" height="32" fill="#ED2939"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif" stroke="#000" strokeWidth="0.5">40</text>
  </svg>
);

// Default fallback
const DefaultIcon = ({ symbol }: { symbol: string }) => {
  const abbr = getSymbolAbbreviation(symbol);
  return (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle cx="16" cy="16" r="16" fill="#4A5568"/>
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize={abbr.length > 3 ? "7" : "10"} fontWeight="700" fontFamily="Arial, sans-serif">{abbr}</text>
    </svg>
  );
};

function getSymbolAbbreviation(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s.includes('NAS') || s.includes('NDX') || s === 'NQ') return 'NAS';
  if (s.includes('US30') || s.includes('DJI') || s.includes('DOW') || s === 'YM') return 'DOW';
  if (s.includes('US500') || s.includes('SPX') || s.includes('SP500') || s === 'ES') return 'SPX';
  if (s.includes('GER') || s.includes('DAX')) return 'DAX';
  if (s.includes('UK100') || s.includes('FTSE')) return 'FTSE';
  if (s.includes('NIK') || s.includes('JP225') || s === 'NKD') return 'N225';
  if (s.startsWith('BTC')) return 'BTC';
  if (s.startsWith('ETH')) return 'ETH';
  if (s.startsWith('SOL')) return 'SOL';
  if (s.startsWith('XRP')) return 'XRP';
  if (s.includes('USDT')) return 'USDT';
  if (s.startsWith('LTC')) return 'LTC';
  if (s.includes('XAU') || s.includes('GOLD') || s === 'GC') return 'XAU';
  if (s.includes('XAG') || s.includes('SILVER') || s === 'SI') return 'XAG';
  if (s.includes('OIL') || s.includes('WTI') || s.includes('BRENT') || s === 'CL') return 'OIL';
  if (s.startsWith('EUR')) return 'EUR';
  if (s.startsWith('GBP')) return 'GBP';
  if (s.startsWith('USD') && s.length === 6) return s.slice(3, 6);
  if (s.includes('JPY')) return 'JPY';
  if (s.includes('CHF')) return 'CHF';
  if (s.includes('AUD')) return 'AUD';
  if (s.includes('CAD')) return 'CAD';
  if (s.includes('NZD')) return 'NZD';
  if (s === 'AAPL') return 'AAPL';
  if (s === 'TSLA') return 'TSLA';
  if (s === 'NVDA') return 'NVDA';
  if (s === 'AMZN') return 'AMZN';
  if (s === 'GOOGL' || s === 'GOOG') return 'GOOG';
  if (s === 'META' || s === 'FB') return 'META';
  if (s === 'MSFT') return 'MSFT';
  return s.substring(0, 4);
}

// Parse forex pair to get base and quote currencies
function parseForexPair(symbol: string): { base: string; quote: string } | null {
  const s = symbol.toUpperCase();
  const currencies = ['EUR', 'GBP', 'USD', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'SGD', 'HKD', 'CNY', 'CNH', 'SEK', 'NOK', 'MXN', 'ZAR', 'TRY', 'PLN', 'THB', 'INR'];
  
  for (const base of currencies) {
    if (s.startsWith(base)) {
      for (const quote of currencies) {
        if (base !== quote && s.includes(quote)) {
          return { base, quote };
        }
      }
    }
  }
  return null;
}

function getSymbolIcon(symbol: string): React.ReactNode {
  const s = symbol.toUpperCase();
  
  // Crypto - use TradingView CDN
  const cryptoSymbols: Record<string, string> = {
    'BTC': 'BTC', 'ETH': 'ETH', 'SOL': 'SOL', 'XRP': 'XRP', 'USDT': 'USDT',
    'LTC': 'LTC', 'DOGE': 'DOGE', 'ADA': 'ADA', 'DOT': 'DOT', 'AVAX': 'AVAX',
    'LINK': 'LINK', 'MATIC': 'MATIC', 'POL': 'MATIC', 'BNB': 'BNB', 'UNI': 'UNI',
    'ATOM': 'ATOM', 'XLM': 'XLM', 'ALGO': 'ALGO', 'VET': 'VET', 'HBAR': 'HBAR',
    'NEAR': 'NEAR', 'APE': 'APE', 'SAND': 'SAND', 'MANA': 'MANA', 'AXS': 'AXS',
    'FTM': 'FTM', 'EGLD': 'EGLD', 'SHIB': 'SHIB', 'CRO': 'CRO', 'TRX': 'TRX',
    'EOS': 'EOS', 'XMR': 'XMR', 'AAVE': 'AAVE', 'MKR': 'MKR', 'COMP': 'COMP',
    'SNX': 'SNX', 'YFI': 'YFI', 'SUSHI': 'SUSHI', '1INCH': '1INCH', 'CRV': 'CRV',
  };
  
  for (const [key, value] of Object.entries(cryptoSymbols)) {
    if (s.startsWith(key) || s.includes(key)) {
      return (
        <TradingViewIcon 
          src={getTradingViewCryptoUrl(value)}
          alt={key}
          fallbackIcon={key === 'BTC' ? <BitcoinIcon /> : key === 'ETH' ? <EthereumIcon /> : <DefaultIcon symbol={symbol} />}
        />
      );
    }
  }
  
  // Indices - use TradingView provider logos
  const indexSymbols: Record<string, { url: string; fallback: React.ReactNode }> = {
    'NAS100': { url: '', fallback: <NasdaqIcon /> },
    'NDX': { url: '', fallback: <NasdaqIcon /> },
    'NQ': { url: '', fallback: <NasdaqIcon /> },
    'US30': { url: 'https://s3-symbol-logo.tradingview.com/indices/dow-30.svg', fallback: <DowIcon /> },
    'DJI': { url: 'https://s3-symbol-logo.tradingview.com/indices/dow-30.svg', fallback: <DowIcon /> },
    'YM': { url: 'https://s3-symbol-logo.tradingview.com/indices/dow-30.svg', fallback: <DowIcon /> },
    'US500': { url: 'https://s3-symbol-logo.tradingview.com/indices/s-and-p-500.svg', fallback: <SP500Icon /> },
    'SPX': { url: 'https://s3-symbol-logo.tradingview.com/indices/s-and-p-500.svg', fallback: <SP500Icon /> },
    'ES': { url: 'https://s3-symbol-logo.tradingview.com/indices/s-and-p-500.svg', fallback: <SP500Icon /> },
    'DAX': { url: 'https://s3-symbol-logo.tradingview.com/indices/dax.svg', fallback: <DaxIcon /> },
    'GER40': { url: 'https://s3-symbol-logo.tradingview.com/indices/dax.svg', fallback: <DaxIcon /> },
    'UK100': { url: 'https://s3-symbol-logo.tradingview.com/indices/uk-100.svg', fallback: <FTSEIcon /> },
    'FTSE': { url: 'https://s3-symbol-logo.tradingview.com/indices/uk-100.svg', fallback: <FTSEIcon /> },
    'JP225': { url: 'https://s3-symbol-logo.tradingview.com/indices/nikkei-225.svg', fallback: <NikkeiIcon /> },
    'NIK': { url: 'https://s3-symbol-logo.tradingview.com/indices/nikkei-225.svg', fallback: <NikkeiIcon /> },
    'VIX': { url: 'https://s3-symbol-logo.tradingview.com/indices/volatility-s-and-p-500.svg', fallback: <VIXIcon /> },
    'RUT': { url: 'https://s3-symbol-logo.tradingview.com/indices/russell-2000.svg', fallback: <RussellIcon /> },
    'RTY': { url: 'https://s3-symbol-logo.tradingview.com/indices/russell-2000.svg', fallback: <RussellIcon /> },
    'HSI': { url: 'https://s3-symbol-logo.tradingview.com/indices/hang-seng.svg', fallback: <HangSengIcon /> },
    'CAC': { url: 'https://s3-symbol-logo.tradingview.com/indices/cac-40.svg', fallback: <CACIcon /> },
    'FRA40': { url: 'https://s3-symbol-logo.tradingview.com/indices/cac-40.svg', fallback: <CACIcon /> },
  };
  
  for (const [key, { url, fallback }] of Object.entries(indexSymbols)) {
    if (s.includes(key)) {
      // Use fallback directly if no URL provided (e.g., NAS100 should always be blue)
      if (!url) return fallback;
      return <TradingViewIcon src={url} alt={key} fallbackIcon={fallback} />;
    }
  }
  
  // Commodities - use TradingView provider logos
  const commoditySymbols: Record<string, { url: string; fallback: React.ReactNode }> = {
    'XAUUSD': { url: 'https://s3-symbol-logo.tradingview.com/metal/gold.svg', fallback: <GoldIcon /> },
    'GOLD': { url: 'https://s3-symbol-logo.tradingview.com/metal/gold.svg', fallback: <GoldIcon /> },
    'GC': { url: 'https://s3-symbol-logo.tradingview.com/metal/gold.svg', fallback: <GoldIcon /> },
    'XAU': { url: 'https://s3-symbol-logo.tradingview.com/metal/gold.svg', fallback: <GoldIcon /> },
    'XAGUSD': { url: 'https://s3-symbol-logo.tradingview.com/metal/silver.svg', fallback: <SilverIcon /> },
    'SILVER': { url: 'https://s3-symbol-logo.tradingview.com/metal/silver.svg', fallback: <SilverIcon /> },
    'XAG': { url: 'https://s3-symbol-logo.tradingview.com/metal/silver.svg', fallback: <SilverIcon /> },
    'SI': { url: 'https://s3-symbol-logo.tradingview.com/metal/silver.svg', fallback: <SilverIcon /> },
    'USOIL': { url: 'https://s3-symbol-logo.tradingview.com/crude-oil.svg', fallback: <OilIcon /> },
    'OIL': { url: 'https://s3-symbol-logo.tradingview.com/crude-oil.svg', fallback: <OilIcon /> },
    'WTI': { url: 'https://s3-symbol-logo.tradingview.com/crude-oil.svg', fallback: <OilIcon /> },
    'CL': { url: 'https://s3-symbol-logo.tradingview.com/crude-oil.svg', fallback: <OilIcon /> },
    'BRENT': { url: 'https://s3-symbol-logo.tradingview.com/crude-oil.svg', fallback: <OilIcon /> },
    'NATGAS': { url: 'https://s3-symbol-logo.tradingview.com/natural-gas.svg', fallback: <NatGasIcon /> },
    'NG': { url: 'https://s3-symbol-logo.tradingview.com/natural-gas.svg', fallback: <NatGasIcon /> },
    'COPPER': { url: 'https://s3-symbol-logo.tradingview.com/metal/copper.svg', fallback: <CopperIcon /> },
    'HG': { url: 'https://s3-symbol-logo.tradingview.com/metal/copper.svg', fallback: <CopperIcon /> },
    'XPT': { url: 'https://s3-symbol-logo.tradingview.com/metal/platinum.svg', fallback: <PlatinumIcon /> },
    'PLATINUM': { url: 'https://s3-symbol-logo.tradingview.com/metal/platinum.svg', fallback: <PlatinumIcon /> },
    'XPD': { url: 'https://s3-symbol-logo.tradingview.com/metal/palladium.svg', fallback: <PalladiumIcon /> },
    'PALLADIUM': { url: 'https://s3-symbol-logo.tradingview.com/metal/palladium.svg', fallback: <PalladiumIcon /> },
  };
  
  for (const [key, { url, fallback }] of Object.entries(commoditySymbols)) {
    if (s.includes(key)) {
      return <TradingViewIcon src={url} alt={key} fallbackIcon={fallback} />;
    }
  }
  
  // Forex pairs - check for currency pairs
  const forexPair = parseForexPair(s);
  if (forexPair) {
    return <ForexPairIcon base={forexPair.base} quote={forexPair.quote} />;
  }
  
  // Stocks - use TradingView provider logos
  const stockSymbols: Record<string, string> = {
    'AAPL': 'apple', 'TSLA': 'tesla', 'NVDA': 'nvidia', 'AMZN': 'amazon',
    'GOOGL': 'alphabet', 'GOOG': 'alphabet', 'META': 'meta-platforms',
    'MSFT': 'microsoft', 'AMD': 'amd', 'INTC': 'intel', 'NFLX': 'netflix',
    'DIS': 'walt-disney', 'PYPL': 'paypal', 'V': 'visa', 'MA': 'mastercard',
    'JPM': 'jpmorgan-chase', 'BAC': 'bank-of-america', 'GS': 'goldman-sachs',
    'KO': 'coca-cola', 'PEP': 'pepsico', 'MCD': 'mcdonalds', 'SBUX': 'starbucks',
    'NKE': 'nike', 'WMT': 'walmart', 'COST': 'costco', 'HD': 'home-depot',
    'CRM': 'salesforce', 'ORCL': 'oracle', 'ADBE': 'adobe', 'CSCO': 'cisco',
    'IBM': 'ibm', 'QCOM': 'qualcomm', 'TXN': 'texas-instruments',
    'BA': 'boeing', 'CAT': 'caterpillar', 'GE': 'general-electric',
    'XOM': 'exxon', 'CVX': 'chevron', 'COP': 'conocophillips',
    'JNJ': 'johnson-and-johnson', 'PFE': 'pfizer', 'UNH': 'unitedhealth',
    'MRK': 'merck', 'ABBV': 'abbvie', 'LLY': 'eli-lilly',
    'T': 'at-and-t', 'VZ': 'verizon', 'TMUS': 't-mobile-us',
  };
  
  if (stockSymbols[s]) {
    return (
      <TradingViewIcon 
        src={`https://s3-symbol-logo.tradingview.com/${stockSymbols[s]}.svg`}
        alt={s}
        fallbackIcon={<DefaultIcon symbol={symbol} />}
      />
    );
  }
  
  return <DefaultIcon symbol={symbol} />;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12'
};

// Memoized SymbolIcon to prevent unnecessary re-renders during transitions
export const SymbolIcon = memo(function SymbolIcon({ symbol, size = 'md', className }: SymbolIconProps) {
  return (
    <div 
      className={cn(
        'flex items-center justify-center flex-shrink-0 rounded-full overflow-hidden',
        sizeClasses[size],
        className
      )}
    >
      {getSymbolIcon(symbol)}
    </div>
  );
});
