import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  DataIndex,
  EventVisibility,
  HeatmapMode,
  MapId,
  MatchData,
  PlayerVisibility,
} from '../types';
import { Filters } from './Filters';
import { MapViewer } from './MapViewer';
import { Timeline } from './Timeline';
import { EventLegend } from './EventLegend';
import { Sidebar } from './Sidebar';
import { InsightsPanel } from './InsightsPanel';
import { formatDateLabel, formatMapLabel } from '../utils/coordinateMapper';

const DEFAULT_EVENTS: EventVisibility = {
  kill: true,
  death: true,
  loot: true,
  storm: true,
};

const DEFAULT_PLAYERS: PlayerVisibility = {
  humans: true,
  bots: true,
};

export function App() {
  const [index, setIndex] = useState<DataIndex | null>(null);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mapId, setMapId] = useState<MapId | 'all'>('AmbroseValley');
  const [date, setDate] = useState<string | 'all'>('all');
  const [matchId, setMatchId] = useState<string>('');
  const [heatmap, setHeatmap] = useState<HeatmapMode>('none');
  const [events, setEvents] = useState<EventVisibility>(DEFAULT_EVENTS);
  const [players, setPlayers] = useState<PlayerVisibility>(DEFAULT_PLAYERS);
  const [showTrails, setShowTrails] = useState(true);
  const [playerQuery, setPlayerQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/processed/index.json')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load match index');
        return r.json();
      })
      .then((data: DataIndex) => {
        setIndex(data);
        const preferred =
          data.matches.find(
            (m) => m.map === 'AmbroseValley' && m.duration >= 120 && m.kills >= 2 && m.humans >= 1,
          ) ??
          data.matches.find((m) => m.duration >= 60 && (m.kills >= 1 || m.loot >= 5)) ??
          data.matches[0];
        if (preferred) {
          setMapId(preferred.map);
          setDate(preferred.date);
          setMatchId(preferred.safeId);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredMatches = useMemo(() => {
    if (!index) return [];
    return index.matches.filter((m) => {
      if (mapId !== 'all' && m.map !== mapId) return false;
      if (date !== 'all' && m.date !== date) return false;
      return true;
    });
  }, [index, mapId, date]);

  useEffect(() => {
    if (!filteredMatches.length) {
      setMatchId('');
      return;
    }
    if (!filteredMatches.some((m) => m.safeId === matchId)) {
      setMatchId(filteredMatches[0].safeId);
    }
  }, [filteredMatches, matchId]);

  useEffect(() => {
    if (!matchId) {
      setMatch(null);
      return;
    }
    let cancelled = false;
    setMatchLoading(true);
    setPlaying(false);
    fetch(`/processed/matches/${matchId}.json`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load match');
        return r.json();
      })
      .then((data: MatchData) => {
        if (!cancelled) {
          setMatch(data);
          // Show the full journey on load; Play restarts from 0
          setCurrentTime(Math.max(data.duration, 0));
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setMatchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  useEffect(() => {
    if (!playing || !match) return;
    const duration = Math.max(match.duration, 0.1);
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      setCurrentTime((t) => {
        const next = t + dt;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, match]);

  const togglePlay = useCallback(() => {
    setPlaying((wasPlaying) => {
      if (wasPlaying) return false;
      // Restart from the beginning when Play is pressed at/near the end
      setCurrentTime((t) => {
        const duration = match?.duration ?? 0;
        if (!match || duration <= 0) return 0;
        if (t >= duration - 0.05) return 0;
        return t;
      });
      return true;
    });
  }, [match]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === 'f' || e.key === 'F') setFullscreen((f) => !f);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay]);

  const onSeek = useCallback((t: number) => {
    setCurrentTime(t);
  }, []);

  if (loading) {
    return (
      <div className="app-shell loading-screen">
        <div className="loader">
          <span className="loader-mark">LILA</span>
          <p>Loading player journeys…</p>
        </div>
      </div>
    );
  }

  if (error || !index) {
    return (
      <div className="app-shell loading-screen">
        <p className="error-text">{error ?? 'Unable to load data'}</p>
      </div>
    );
  }

  const mapImage =
    match && index.mapImages[match.map]
      ? index.mapImages[match.map]
      : mapId !== 'all'
        ? index.mapImages[mapId]
        : index.mapImages.AmbroseValley;

  return (
    <div className={`app-shell ${fullscreen ? 'is-fullscreen' : ''}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">LILA</span>
          <div>
            <h1>Player Journey Viewer</h1>
            <p>Level design telemetry · {index.matchCount} matches</p>
          </div>
        </div>
        <div className="topbar-meta">
          {match && (
            <span>
              {formatMapLabel(match.map)} · {formatDateLabel(match.date)}
            </span>
          )}
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setFullscreen((f) => !f)}
            title="Toggle fullscreen map (F)"
          >
            {fullscreen ? 'Exit focus' : 'Focus map'}
          </button>
        </div>
      </header>

      <aside className="sidebar-pane">
        <Filters
          maps={index.maps}
          dates={index.dates}
          matches={filteredMatches}
          mapId={mapId}
          date={date}
          matchId={matchId}
          heatmap={heatmap}
          events={events}
          players={players}
          showTrails={showTrails}
          playerQuery={playerQuery}
          onMapChange={setMapId}
          onDateChange={setDate}
          onMatchChange={setMatchId}
          onHeatmapChange={setHeatmap}
          onEventsChange={setEvents}
          onPlayersChange={setPlayers}
          onShowTrailsChange={setShowTrails}
          onPlayerQueryChange={setPlayerQuery}
        />
        <EventLegend />
        {match && <Sidebar match={match} hoveredPlayerId={hoveredPlayerId} />}
        <InsightsPanel />
      </aside>

      <main className="map-pane">
        {matchLoading && <div className="map-loading">Loading match…</div>}
        <MapViewer
          match={match}
          mapImage={mapImage}
          currentTime={currentTime}
          heatmap={heatmap}
          events={events}
          players={players}
          showTrails={showTrails}
          playerQuery={playerQuery}
          hoveredPlayerId={hoveredPlayerId}
          onHoverPlayer={setHoveredPlayerId}
        />
        <Timeline
          duration={match?.duration ?? 0}
          currentTime={currentTime}
          playing={playing}
          speed={speed}
          onSeek={onSeek}
          onTogglePlay={togglePlay}
          onSpeedChange={setSpeed}
        />
      </main>
    </div>
  );
}
