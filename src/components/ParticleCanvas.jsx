import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const COLORS = ['#ff00a0', '#d4ff00', '#00e676', '#0055ff', '#ffffff'];

const ParticleCanvas = forwardRef(({ active = true }, ref) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);

  useImperativeHandle(ref, () => ({
    emit(xNorm, yNorm, count = 18) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const x = xNorm * canvas.width;
      const y = yNorm * canvas.height;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.5,
          life: 1,
          decay: 0.014 + Math.random() * 0.016,
          size: 3 + Math.random() * 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          isSquare: Math.random() > 0.45,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.15,
        });
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const parts = particlesRef.current;

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.vy += 0.12;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985;
        p.life -= p.decay;
        p.rotation += p.rotSpeed;

        if (p.life <= 0) { parts.splice(i, 1); continue; }

        ctx.globalAlpha = Math.min(1, p.life * 1.5);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.isSquare) {
          ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 15,
      }}
    />
  );
});

ParticleCanvas.displayName = 'ParticleCanvas';
export default ParticleCanvas;
