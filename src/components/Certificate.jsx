import React, { useRef, useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { getRank } from './ProgressBar';

const Certificate = ({ name, score, photoDataUrl, onClose }) => {
  const canvasRef = useRef(null);
  const [certDataUrl, setCertDataUrl] = useState(null);
  const [qrUrl, setQrUrl] = useState('');

  const getDate = () => {
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
  };

  useEffect(() => {
    drawCertificate();
  }, []);

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
    ctx.fillText('/// FESTIWAL NAUKI UO 2026 /// 67 GAME /// CERTYFIKAT ///', W / 2, 100);

    // Title
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 64px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTYFIKAT', W / 2, 210);

    // Subtitle
    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.fillText('UCZESTNICTWA W WYZWANIU "67"', W / 2, 250);

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

    // Draw photo if available
    if (photoDataUrl) {
      const img = new Image();
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
      img.src = photoDataUrl;
    } else {
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(photoX + 4, photoY + 4, photoW - 8, photoH - 8);
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 20px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📷', photoX + photoW / 2, photoY + photoH / 2 + 8);
      finishDraw(ctx, W, H);
    }
  };

  const finishDraw = (ctx, W, H) => {
    const rank = getRank(score).label;
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
    ctx.fillText('WYNIK', infoX + 170, 425);
    ctx.font = 'bold 36px "Space Grotesk", sans-serif';
    ctx.fillText(`${score} powtórzeń`, infoX + 170, 465);

    // Rank box
    ctx.fillStyle = '#00e676';
    ctx.fillRect(infoX + 360, 400, 330, 80);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 4;
    ctx.strokeRect(infoX + 360, 400, 330, 80);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 18px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RANGA', infoX + 525, 425);
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
    ctx.fillText(`Data: ${date}   •   Festiwal Nauki UO`, infoX + 345, 533);

    // Bottom banner
    ctx.fillStyle = '#111111';
    ctx.fillRect(50, H - 130, W - 100, 80);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, H - 130, W - 100, 80);

    ctx.fillStyle = '#d4ff00';
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('/// 67 GAME /// SPRAWDŹ SWOJĄ SZYBKOŚĆ /// FESTIWAL NAUKI UO 2026 ///', W / 2, H - 82);

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
    ctx.fillText('67 GAME', 70, 28);
    ctx.restore();

    ctx.save();
    ctx.translate(W - 240, H - 185);
    ctx.rotate(0.08);
    ctx.fillStyle = '#ff00a0';
    ctx.fillRect(0, 0, 180, 40);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 180, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NAUKI UO 2026', 90, 28);
    ctx.restore();

    // Generate data URL
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setCertDataUrl(dataUrl);

    // Generate QR URL (compact — just name, score, rank for re-rendering)
    try {
      const host = window.location.host;
      const protocol = window.location.protocol;
      let certUrl = `${protocol}//${host}/?cert=${encodeURIComponent(name)}&score=${score}`;

      if (photoDataUrl) {
        const img = new Image();
        img.onload = () => {
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = 100;
          thumbCanvas.height = 75;
          const thumbCtx = thumbCanvas.getContext('2d');
          thumbCtx.drawImage(img, 0, 0, 100, 75);
          // Compress heavily for QR code capacity
          const miniPhoto = thumbCanvas.toDataURL('image/jpeg', 0.3);
          certUrl += `#photo=${encodeURIComponent(miniPhoto)}`;
          setQrUrl(certUrl);
        };
        img.src = photoDataUrl;
      } else {
        setQrUrl(certUrl);
      }
    } catch {
      setQrUrl(`67 GAME - ${name} - ${score} pkt - ${rank}`);
    }
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
          🏆 TWÓJ CERTYFIKAT! 🏆
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
              📄 POBIERZ PDF
            </button>
            <button className="btn-secondary" onClick={downloadImage} style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }}>
              🖼️ POBIERZ PNG
            </button>
          </div>

          {qrUrl && (
            <div className="cert-qr">
              <p style={{ fontWeight: '800', fontSize: '1rem', margin: '0.5rem 0' }}>
                📱 Zeskanuj QR kodem by zobaczyć certyfikat na telefonie:
              </p>
              <div className="qr-box">
                <QRCodeSVG value={qrUrl} size={140} level="L"
                  bgColor="#ffffff" fgColor="#111111" />
              </div>
            </div>
          )}
        </div>

        <button className="btn-secondary" onClick={onClose}
          style={{ marginTop: '1rem', fontSize: '1rem', padding: '0.6rem 1.5rem' }}>
          ZAMKNIJ
        </button>
      </div>
    </div>
  );
};

export default Certificate;
