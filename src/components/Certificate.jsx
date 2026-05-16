import React, { useRef, useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { getRank } from './ProgressBar';
import useLanguage from '../hooks/useLanguage';

const Certificate = ({ name, score, photoDataUrl, uploadedPhotoUrl, onClose }) => {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const [certDataUrl, setCertDataUrl] = useState(null);

  const getDate = () => {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
  };

  useEffect(() => {
    drawCertificate();
  }, [t, name, score]);

  const drawCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = 1200;
    const H = 850;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = '#f4f0ea';
    ctx.fillRect(0, 0, W, H);

    // Dot grid background
    ctx.fillStyle = '#11111115';
    for (let x = 0; x < W; x += 20) {
      for (let y = 0; y < H; y += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Thick border
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Inner border
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    // Top banner
    ctx.fillStyle = '#0055ff';
    ctx.fillRect(50, 50, W - 100, 80);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, W - 100, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`/// ${t('globalChallenge')} /// ${t('speedGame')} /// ${t('certificateOf')} ///`, W / 2, 100);

    // Title
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 64px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('certificateOf').toUpperCase(), W / 2, 210);

    // Subtitle
    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.fillText(t('challenge67').toUpperCase(), W / 2, 250);

    // Decorative line
    ctx.fillStyle = '#d4ff00';
    ctx.fillRect(200, 270, W - 400, 6);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 270, W - 400, 6);

    // Photo area — left side
    const photoX = 80;
    const photoY = 310;
    const photoW = 320;
    const photoH = 240;

    // Photo border (brutalist)
    ctx.fillStyle = '#111111';
    ctx.fillRect(photoX + 6, photoY + 6, photoW, photoH);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 4;
    ctx.strokeRect(photoX, photoY, photoW, photoH);

    const photoSource = photoDataUrl || uploadedPhotoUrl;
    
    // Draw photo if available (from base64 or ImgBB URL)
    if (photoSource) {
      const img = new Image();
      // CORS workaround: set crossOrigin for external URLs to keep canvas tainted-safe
      if (photoSource.startsWith('http')) {
        img.crossOrigin = "anonymous";
      }
      
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(photoX + 4, photoY + 4, photoW - 8, photoH - 8);
        ctx.clip();
        // Scale to cover
        const scale = Math.max((photoW - 8) / img.width, (photoH - 8) / img.height);
        const dx = photoX + 4 + ((photoW - 8) - img.width * scale) / 2;
        const dy = photoY + 4 + ((photoH - 8) - img.height * scale) / 2;
        ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
        ctx.restore();
        finishDraw(ctx, W, H);
      };
      
      img.onerror = () => {
        // If image fails (e.g. CORS block in some browsers), draw a fallback icon
        drawFallbackCamera(ctx, photoX, photoY, photoW, photoH);
        finishDraw(ctx, W, H);
      };
      
      img.src = photoSource;
    } else {
      drawFallbackCamera(ctx, photoX, photoY, photoW, photoH);
      finishDraw(ctx, W, H);
    }
  };

  const drawFallbackCamera = (ctx, photoX, photoY, photoW, photoH) => {
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(photoX + 4, photoY + 4, photoW - 8, photoH - 8);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 20px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📷', photoX + photoW / 2, photoY + photoH / 2 + 8);
  };

  const finishDraw = (ctx, W, H) => {
    const rank = getRank(score, t).label;
    const date = getDate();

    // Info section — right side
    const infoX = 450;

    // Player name box
    ctx.fillStyle = '#ff00a0';
    ctx.fillRect(infoX, 310, 690, 70);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 4;
    ctx.strokeRect(infoX, 310, 690, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), infoX + 345, 358);

    // Score box
    ctx.fillStyle = '#d4ff00';
    ctx.fillRect(infoX, 400, 340, 80);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 4;
    ctx.strokeRect(infoX, 400, 340, 80);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 18px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('scoreHUD').replace(':', '').toUpperCase(), infoX + 170, 425);
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.fillText(`${score} ${t('reps')}`, infoX + 170, 465);

    // Rank box
    ctx.fillStyle = '#00e676';
    ctx.fillRect(infoX + 360, 400, 330, 80);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 4;
    ctx.strokeRect(infoX + 360, 400, 330, 80);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 18px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('rank').replace(':', '').toUpperCase(), infoX + 525, 425);
    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.fillText(rank, infoX + 525, 465);

    // Date box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(infoX, 500, 690, 50);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3;
    ctx.strokeRect(infoX, 500, 690, 50);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 22px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${date}   •   ${t('globalChallenge')}`, infoX + 345, 533);

    // Bottom banner
    ctx.fillStyle = '#111111';
    ctx.fillRect(50, H - 130, W - 100, 80);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, H - 130, W - 100, 80);

    ctx.fillStyle = '#d4ff00';
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`/// ${t('speedGame')} /// ${t('testSpeed')} /// ${t('globalChallenge')} ///`, W / 2, H - 82);

    // Decorative stickers
    ctx.save();
    ctx.translate(100, H - 180);
    ctx.rotate(-0.1);
    ctx.fillStyle = '#0055ff';
    ctx.fillRect(0, 0, 140, 40);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 140, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('speedGame'), 70, 28);
    ctx.restore();

    ctx.save();
    ctx.translate(W - 260, H - 185);
    ctx.rotate(0.08);
    ctx.fillStyle = '#0055ff';
    ctx.fillRect(0, 0, 210, 40);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 210, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MADE BY ITOM • itomdev.com', 105, 27);
    ctx.restore();

    // Generate data URL
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setCertDataUrl(dataUrl);
  };

  const downloadPDF = () => {
    if (!certDataUrl) return;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1200, 850] });
    pdf.addImage(certDataUrl, 'PNG', 0, 0, 1200, 850);
    pdf.save(`67game_certyfikat_${name}.pdf`);
  };

  const downloadImage = () => {
    if (!certDataUrl) return;
    const link = document.createElement('a');
    link.download = `67game_certyfikat_${name}.png`;
    link.href = certDataUrl;
    link.click();
  };

  return (
    <div className="certificate-overlay">
      <div className="certificate-modal">
        <h2 className="glow-text" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          🏆 {t('certificateOf').toUpperCase()} 🏆
        </h2>

        <div className="cert-preview-wrapper">
          <canvas
            ref={canvasRef}
            className="cert-canvas"
          />
        </div>

        <div className="cert-actions">
          <div className="cert-buttons">
            <button className="btn-primary" onClick={downloadPDF} style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }}>
              📄 PDF
            </button>
            <button className="btn-secondary" onClick={downloadImage} style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }}>
              🖼️ {t('download')}
            </button>
          </div>
        </div>

        <button className="btn-secondary" onClick={onClose}
          style={{ marginTop: '1rem', fontSize: '1rem', padding: '0.6rem 1.5rem' }}>
          {t('close')}
        </button>
      </div>
    </div>
  );
};

export default Certificate;
