import React, { useEffect, useRef } from 'react';

const FLAME_COLORS = [
  '#ff00a0', '#ff2ebc', '#ff69d4', // pink tones
  '#d4ff00', '#e8ff44', '#ffee00', // yellow tones  
  '#ff6b00', '#ff4400',            // orange accents
];

const Flames = ({ active }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = canvas.width;
    const H = canvas.height;

    // Camera rect within the canvas (centered, with padding around for flames)
    const pad = 140;
    const camX = pad;
    const camY = pad;
    const camW = W - pad * 2;
    const camH = H - pad * 2;

    const spawnParticle = () => {
      // Spawn from bottom edge, left edge, or right edge of camera area
      const side = Math.random();
      let x, y, vx, vy;

      if (side < 0.5) {
        // Bottom edge
        x = camX + Math.random() * camW;
        y = camY + camH + Math.random() * 10;
        vx = (Math.random() - 0.5) * 1.2;
        vy = -(1.5 + Math.random() * 2.5);
      } else if (side < 0.75) {
        // Left edge
        x = camX - Math.random() * 15;
        y = camY + camH * 0.3 + Math.random() * camH * 0.7;
        vx = -(0.5 + Math.random() * 1.0);
        vy = -(1.0 + Math.random() * 2.0);
      } else {
        // Right edge
        x = camX + camW + Math.random() * 15;
        y = camY + camH * 0.3 + Math.random() * camH * 0.7;
        vx = 0.5 + Math.random() * 1.0;
        vy = -(1.0 + Math.random() * 2.0);
      }

      return {
        x, y, vx, vy,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        size: 4 + Math.random() * 10,
        color: FLAME_COLORS[Math.floor(Math.random() * FLAME_COLORS.length)],
        isSquare: Math.random() > 0.6,
        wobbleSpeed: 2 + Math.random() * 4,
        wobbleAmount: 0.3 + Math.random() * 0.8,
        age: 0,
      };
    };

    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      const parts = particlesRef.current;

      // Spawn new particles when active
      if (activeRef.current) {
        // Spawn 2-3 particles per frame for smooth continuous fire
        const spawnCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < spawnCount; i++) {
          parts.push(spawnParticle());
        }
      }

      // Update and draw
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += 1;
        p.x += p.vx + Math.sin(p.age * 0.05 * p.wobbleSpeed) * p.wobbleAmount;
        p.y += p.vy;
        p.vy *= 0.995; // slight deceleration
        p.life -= p.decay;
        p.size *= 0.997; // shrink slightly

        if (p.life <= 0 || p.size < 1) {
          parts.splice(i, 1);
          continue;
        }

        const alpha = Math.min(1, p.life * 1.8);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        
        // Neon glow
        ctx.shadowBlur = 12 * alpha;
        ctx.shadowColor = p.color;

        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.isSquare) {
          // Brutalist squares
          const s = p.size;
          ctx.fillRect(-s, -s, s * 2, s * 2);
          // Black border for brutalism
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-s, -s, s * 2, s * 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={920}
      height={760}
      className="flames-canvas"
    />
  );
};

export default Flames;
