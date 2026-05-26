import { useState, useRef, useCallback, useEffect } from 'react';
import { RaidActivity, FireteamMember } from '../utils/bungieApi';
import { getRaidSlug } from '../utils/raidDefinitions';

interface Props {
  raids: RaidActivity[];
  playerName: string;
  onLoadFireteam: (instanceId: string, origin?: string) => Promise<FireteamMember[] | null>;
}

interface RaidMemory {
  raidName: string;
  firstClearDate: string;
  instanceId: string;
  origin: 'd2' | 'd1-reprised' | 'd1' | 'unknown';
  fireteamMembers: FireteamMember[];
  totalClears: number;
}

const STORAGE_KEY = 'raidviewer-artwork';

function loadArtwork(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveArtwork(data: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function RaidMemories({ raids, playerName, onLoadFireteam }: Props) {
  const [artwork, setArtwork] = useState<Record<string, string>>(loadArtwork);
  const [memories, setMemories] = useState<RaidMemory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Build memories: one per unique raid, using the first clear
  useEffect(() => {
    const build = async () => {
      // Find first clear of each raid (raids are sorted newest-first, so iterate reversed)
      const firstClears = new Map<string, RaidActivity>();
      const clearCounts = new Map<string, number>();

      for (const raid of raids) {
        const name = raid.activityName;
        clearCounts.set(name, (clearCounts.get(name) || 0) + 1);
        if (raid.isFirstClear) {
          firstClears.set(name, raid);
        }
      }

      const result: RaidMemory[] = [];

      for (const [raidName, raid] of firstClears) {
        const members = await onLoadFireteam(raid.instanceId, raid.origin);
        result.push({
          raidName,
          firstClearDate: raid.period,
          instanceId: raid.instanceId,
          origin: raid.origin,
          fireteamMembers: members || [],
          totalClears: clearCounts.get(raidName) || 1,
        });
      }

      // Sort by date, oldest first (like the Destiny timeline)
      result.sort((a, b) => new Date(a.firstClearDate).getTime() - new Date(b.firstClearDate).getTime());

      setMemories(result);
      setLoadingMemories(false);
    };

    build();
  }, [raids, onLoadFireteam]);

  const handleImageUpload = useCallback((raidName: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = { ...artwork, [getRaidSlug(raidName)]: dataUrl };
      setArtwork(updated);
      saveArtwork(updated);
    };
    reader.readAsDataURL(file);
  }, [artwork]);

  const handleDrop = useCallback((e: React.DragEvent, raidName: string) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(raidName, file);
    }
  }, [handleImageUpload]);

  const handleDownload = useCallback(async (memory: RaidMemory) => {
    setDownloading(memory.raidName);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const slug = getRaidSlug(memory.raidName);
    const imgSrc = artwork[slug];

    if (!imgSrc) {
      setDownloading(null);
      return;
    }

    // Load the image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Use a 16:9 aspect ratio
      const width = 1920;
      const height = 1080;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw image, cover-fit
      const scale = Math.max(width / img.width, height / img.height);
      const sw = width / scale;
      const sh = height / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

      // Dark gradient overlay at bottom
      const grad = ctx.createLinearGradient(0, height * 0.55, 0, height);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.4, 'rgba(0,0,0,0.6)');
      grad.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Text overlay — bottom right
      const padding = 60;
      const rightEdge = width - padding;
      let y = height - padding - 80;

      // Raid name (with origin badge if D1 or Reprised)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
      ctx.textAlign = 'right';

      const originLabel = memory.origin === 'd1-reprised' ? 'Reprised' : memory.origin === 'd1' ? 'D1' : null;
      if (originLabel) {
        const textWidth = ctx.measureText(memory.raidName).width;
        const badgeX = rightEdge - textWidth - 16;
        const badgeY = y - 38;

        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
        const badgeMetrics = ctx.measureText(originLabel);
        const badgeW = badgeMetrics.width + 16;
        const badgeH = 28;

        const isD1 = memory.origin === 'd1';
        ctx.fillStyle = isD1 ? 'rgba(138,180,216,0.25)' : 'rgba(180,150,100,0.25)';
        ctx.strokeStyle = isD1 ? 'rgba(138,180,216,0.5)' : 'rgba(180,150,100,0.5)';
        ctx.lineWidth = 1;
        ctx.fillRect(badgeX - badgeW - 8, badgeY, badgeW, badgeH);
        ctx.strokeRect(badgeX - badgeW - 8, badgeY, badgeW, badgeH);

        ctx.fillStyle = isD1 ? '#8ab4d8' : '#c8a84e';
        ctx.textAlign = 'center';
        ctx.fillText(originLabel, badgeX - badgeW/2 - 8, badgeY + 20);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
      ctx.fillText(memory.raidName, rightEdge, y);

      // Date
      y += 60;
      ctx.fillStyle = '#c8a84e';
      ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
      ctx.fillText(formatDate(memory.firstClearDate), rightEdge, y);

      // Player name
      y += 42;
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
      ctx.fillText(playerName, rightEdge, y);

      // Fireteam
      if (memory.fireteamMembers.length > 0) {
        y += 50;
        ctx.fillStyle = '#888888';
        ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
        const names = memory.fireteamMembers
          .filter(m => m.completed)
          .map(m => `${m.displayName}#${m.bungieGlobalDisplayNameCode}`)
          .join('  ·  ');
        ctx.fillText(names, rightEdge, y);
      }

      // Total clears
      y += 40;
      ctx.fillStyle = '#666666';
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
      ctx.fillText(`${memory.totalClears} total clear${memory.totalClears !== 1 ? 's' : ''}`, rightEdge, y);

      // Trigger download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${slug}-${playerName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setDownloading(null);
      }, 'image/png');
    };

    img.src = imgSrc;
  }, [artwork, playerName]);

  if (loadingMemories) {
    return <div className="loading-bar">Building memories...</div>;
  }

  if (memories.length === 0) {
    return (
      <div className="empty-state">
        <p>No raid completions found.</p>
      </div>
    );
  }

  return (
    <div className="memories">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <p className="memories-hint">
        Upload artwork for each raid to create your personalised Destiny 2 legacy cards.
        Images are stored locally in your browser.
      </p>

      <div className="memories-grid">
        {memories.map((memory) => {
          const slug = getRaidSlug(memory.raidName);
          const hasArtwork = !!artwork[slug];

          return (
            <div key={memory.raidName} className="memory-card">
              <div
                className={`memory-artwork ${hasArtwork ? 'has-image' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, memory.raidName)}
              >
                {hasArtwork ? (
                  <img src={artwork[slug]} alt={memory.raidName} className="memory-img" />
                ) : (
                  <div className="memory-placeholder">
                    <span className="memory-placeholder-text">{memory.raidName}</span>
                    <span className="memory-placeholder-hint">Drop artwork here</span>
                  </div>
                )}

                {/* Overlay info — bottom right */}
                <div className="memory-overlay">
                  <h3 className="memory-raid-name">
                    {memory.raidName}
                    {memory.origin === 'd1-reprised' && (
                      <span className="origin-badge memory-origin-badge">Reprised</span>
                    )}
                    {memory.origin === 'd1' && (
                      <span className="origin-badge memory-origin-badge d1-badge">D1</span>
                    )}
                  </h3>
                  <p className="memory-date">{formatDate(memory.firstClearDate)}</p>
                  <p className="memory-player">{playerName}</p>
                  {memory.fireteamMembers.length > 0 && (
                    <p className="memory-fireteam">
                      {memory.fireteamMembers
                        .filter(m => m.completed)
                        .map(m => `${m.displayName}#${m.bungieGlobalDisplayNameCode}`)
                        .join('  ·  ')}
                    </p>
                  )}
                  <p className="memory-clears">{memory.totalClears} clear{memory.totalClears !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="memory-actions">
                <label className="memory-upload-btn">
                  {hasArtwork ? 'Change artwork' : 'Upload artwork'}
                  <input
                    type="file"
                    accept="image/*"
                    className="memory-file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(memory.raidName, file);
                    }}
                  />
                </label>
                {hasArtwork && (
                  <button
                    className="memory-download-btn"
                    onClick={() => handleDownload(memory)}
                    disabled={downloading === memory.raidName}
                  >
                    {downloading === memory.raidName ? 'Saving...' : 'Download'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
