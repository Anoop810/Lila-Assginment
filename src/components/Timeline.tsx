import { formatDuration } from '../utils/coordinateMapper';

interface Props {
  duration: number;
  currentTime: number;
  playing: boolean;
  speed: number;
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (s: number) => void;
}

export function Timeline({
  duration,
  currentTime,
  playing,
  speed,
  onSeek,
  onTogglePlay,
  onSpeedChange,
}: Props) {
  return (
    <div className="timeline">
      <button type="button" className="play-btn" onClick={onTogglePlay}>
        {playing ? 'Pause' : 'Play'}
      </button>
      <div className="timeline-track">
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={0.1}
          value={Math.min(currentTime, duration)}
          onChange={(e) => onSeek(Number(e.target.value))}
        />
        <div className="timeline-labels">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
      <div className="speed-group">
        {[1, 2, 5].map((s) => (
          <button
            key={s}
            type="button"
            className={speed === s ? 'active' : ''}
            onClick={() => onSpeedChange(s)}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
