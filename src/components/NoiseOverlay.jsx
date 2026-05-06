import React from 'react';

/**
 * Film grain overlay using SVG feTurbulence filter.
 * Ultra-subtle analog texture — renders at ~0.04 opacity.
 * Respects prefers-reduced-motion.
 * Zero impact on interactivity (pointer-events: none).
 */
const NoiseOverlay = () => {
  return (
    <div className="noise-overlay" aria-hidden="true">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
    </div>
  );
};

export default NoiseOverlay;
