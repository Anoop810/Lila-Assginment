import type {
  EventVisibility,
  HeatmapMode,
  MapId,
  MatchSummary,
  PlayerVisibility,
} from '../types';
import { formatDateLabel, formatDuration, formatMapLabel, shortId } from '../utils/coordinateMapper';

interface Props {
  maps: MapId[];
  dates: string[];
  matches: MatchSummary[];
  mapId: MapId | 'all';
  date: string | 'all';
  matchId: string;
  heatmap: HeatmapMode;
  events: EventVisibility;
  players: PlayerVisibility;
  showTrails: boolean;
  playerQuery: string;
  onMapChange: (v: MapId | 'all') => void;
  onDateChange: (v: string | 'all') => void;
  onMatchChange: (v: string) => void;
  onHeatmapChange: (v: HeatmapMode) => void;
  onEventsChange: (v: EventVisibility) => void;
  onPlayersChange: (v: PlayerVisibility) => void;
  onShowTrailsChange: (v: boolean) => void;
  onPlayerQueryChange: (v: string) => void;
}

export function Filters({
  maps,
  dates,
  matches,
  mapId,
  date,
  matchId,
  heatmap,
  events,
  players,
  showTrails,
  playerQuery,
  onMapChange,
  onDateChange,
  onMatchChange,
  onHeatmapChange,
  onEventsChange,
  onPlayersChange,
  onShowTrailsChange,
  onPlayerQueryChange,
}: Props) {
  return (
    <section className="panel filters-panel">
      <h2>Filters</h2>

      <label className="field">
        <span>Map</span>
        <select
          value={mapId}
          onChange={(e) => onMapChange(e.target.value as MapId | 'all')}
        >
          <option value="all">All maps</option>
          {maps.map((m) => (
            <option key={m} value={m}>
              {formatMapLabel(m)}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Date</span>
        <select value={date} onChange={(e) => onDateChange(e.target.value)}>
          <option value="all">All dates</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatDateLabel(d)}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Match ({matches.length})</span>
        <select value={matchId} onChange={(e) => onMatchChange(e.target.value)}>
          {matches.map((m) => (
            <option key={m.safeId} value={m.safeId}>
              {formatDateLabel(m.date)} · {shortId(m.safeId, 6)} · {m.humans}H/{m.bots}B ·{' '}
              {formatDuration(m.duration)}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="field-group">
        <legend>Heatmap</legend>
        {(
          [
            ['none', 'None'],
            ['traffic', 'Traffic'],
            ['kills', 'Kills'],
            ['deaths', 'Deaths'],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="radio-row">
            <input
              type="radio"
              name="heatmap"
              checked={heatmap === value}
              onChange={() => onHeatmapChange(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <fieldset className="field-group">
        <legend>Players</legend>
        <label className="check-row">
          <input
            type="checkbox"
            checked={players.humans}
            onChange={(e) => onPlayersChange({ ...players, humans: e.target.checked })}
          />
          Humans
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={players.bots}
            onChange={(e) => onPlayersChange({ ...players, bots: e.target.checked })}
          />
          Bots
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={showTrails}
            onChange={(e) => onShowTrailsChange(e.target.checked)}
          />
          Show trails
        </label>
      </fieldset>

      <fieldset className="field-group">
        <legend>Events</legend>
        {(
          [
            ['kill', 'Kills'],
            ['death', 'Deaths'],
            ['loot', 'Loot'],
            ['storm', 'Storm'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="check-row">
            <input
              type="checkbox"
              checked={events[key]}
              onChange={(e) => onEventsChange({ ...events, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <label className="field">
        <span>Search player ID</span>
        <input
          type="search"
          placeholder="UUID or bot id"
          value={playerQuery}
          onChange={(e) => onPlayerQueryChange(e.target.value)}
        />
      </label>
    </section>
  );
}
