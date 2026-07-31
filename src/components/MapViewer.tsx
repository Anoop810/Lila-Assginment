import { useEffect, useMemo } from 'react';
import {
  CircleMarker,
  ImageOverlay,
  MapContainer,
  Polyline,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type {
  EventVisibility,
  HeatmapMode,
  MatchData,
  MatchEvent,
  Player,
  PlayerVisibility,
} from '../types';
import { HeatmapLayer } from './Heatmap';
import { shortId } from '../utils/coordinateMapper';

const MAP_SIZE = 1024;
const BOUNDS: L.LatLngBoundsExpression = [
  [0, 0],
  [MAP_SIZE, MAP_SIZE],
];

const EVENT_COLORS: Record<MatchEvent['type'], string> = {
  kill: '#e5484d',
  death: '#f76808',
  loot: '#f5d90a',
  storm: '#8e4ec6',
};

interface Props {
  match: MatchData | null;
  mapImage: string;
  currentTime: number;
  heatmap: HeatmapMode;
  events: EventVisibility;
  players: PlayerVisibility;
  showTrails: boolean;
  playerQuery: string;
  hoveredPlayerId: string | null;
  onHoverPlayer: (id: string | null) => void;
}

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(BOUNDS, { animate: false });
    // Leaflet often initializes at 0×0 inside flex layouts — force a reflow
    const id = window.setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(BOUNDS, { animate: false });
    }, 50);
    const onResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
}

function pathUntil(player: Player, t: number) {
  return player.path.filter((p) => p.t <= t);
}

function positionAt(player: Player, t: number): LatLngExpression | null {
  const pts = player.path;
  if (!pts.length) return null;
  if (t < pts[0].t) return null;
  let i = 0;
  while (i < pts.length - 1 && pts[i + 1].t <= t) i += 1;
  const a = pts[i];
  const b = pts[i + 1];
  if (!b || b.t === a.t) return [a.py, a.px];
  if (t >= b.t) return [b.py, b.px];
  const u = (t - a.t) / (b.t - a.t);
  return [a.py + (b.py - a.py) * u, a.px + (b.px - a.px) * u];
}

function matchesQuery(player: Player, query: string) {
  if (!query.trim()) return true;
  return player.id.toLowerCase().includes(query.trim().toLowerCase());
}

function visiblePlayer(player: Player, players: PlayerVisibility, query: string) {
  if (player.isBot && !players.bots) return false;
  if (!player.isBot && !players.humans) return false;
  return matchesQuery(player, query);
}

export function MapViewer({
  match,
  mapImage,
  currentTime,
  heatmap,
  events,
  players,
  showTrails,
  playerQuery,
  hoveredPlayerId,
  onHoverPlayer,
}: Props) {
  const heatPoints = useMemo(() => {
    if (!match || heatmap === 'none') return [];
    if (heatmap === 'traffic') {
      return match.players
        .filter((p) => visiblePlayer(p, players, playerQuery))
        .flatMap((p) =>
          p.path.filter((pt) => pt.t <= currentTime).map((pt) => [pt.py, pt.px, 0.4] as [number, number, number]),
        );
    }
    const wantKill = heatmap === 'kills';
    return match.events
      .filter((e) => {
        if (e.t > currentTime) return false;
        if (wantKill) return e.type === 'kill';
        return e.type === 'death' || e.type === 'storm';
      })
      .filter((e) => {
        const p = match.players.find((pl) => pl.id === e.userId);
        if (!p) return events[e.type];
        return visiblePlayer(p, players, playerQuery);
      })
      .map((e) => [e.py, e.px, 0.85] as [number, number, number]);
  }, [match, heatmap, currentTime, players, playerQuery, events]);

  const visibleEvents = useMemo(() => {
    if (!match) return [];
    return match.events.filter((e) => {
      if (!events[e.type]) return false;
      if (e.t > currentTime) return false;
      const p = match.players.find((pl) => pl.id === e.userId);
      if (!p) return true;
      return visiblePlayer(p, players, playerQuery);
    });
  }, [match, events, currentTime, players, playerQuery]);

  const visiblePlayers = useMemo(() => {
    if (!match) return [];
    return match.players.filter((p) => visiblePlayer(p, players, playerQuery));
  }, [match, players, playerQuery]);

  return (
    <div className="map-viewer">
      <MapContainer
        key={mapImage}
        crs={L.CRS.Simple}
        center={[MAP_SIZE / 2, MAP_SIZE / 2]}
        zoom={0}
        minZoom={-2}
        maxZoom={4}
        scrollWheelZoom
        className="leaflet-root"
        maxBounds={BOUNDS}
        maxBoundsViscosity={1}
        style={{ width: '100%', height: '100%' }}
      >
        <FitBounds />
        <ImageOverlay url={mapImage} bounds={BOUNDS} opacity={0.95} />
        {heatmap !== 'none' && <HeatmapLayer points={heatPoints} />}

        {showTrails &&
          visiblePlayers.map((player) => {
            const pts = pathUntil(player, currentTime);
            if (pts.length < 2) return null;
            const latlngs = pts.map((p) => [p.py, p.px] as LatLngExpression);
            const color = player.isBot ? '#3dd68c' : '#52a9ff';
            const active = hoveredPlayerId === player.id;
            return (
              <Polyline
                key={`trail-${player.id}`}
                positions={latlngs}
                pathOptions={{
                  color,
                  weight: active ? 4 : 2,
                  opacity: active ? 0.95 : 0.55,
                }}
                eventHandlers={{
                  mouseover: () => onHoverPlayer(player.id),
                  mouseout: () => onHoverPlayer(null),
                }}
              >
                <Popup>
                  <strong>{player.isBot ? 'Bot' : 'Human'}</strong>
                  <br />
                  {shortId(player.id, 16)}
                  <br />
                  Kills {player.kills} · Loot {player.loot} · Deaths {player.deaths}
                </Popup>
              </Polyline>
            );
          })}

        {visiblePlayers.map((player) => {
          const pos = positionAt(player, currentTime);
          if (!pos) return null;
          const color = player.isBot ? '#3dd68c' : '#52a9ff';
          return (
            <CircleMarker
              key={`dot-${player.id}`}
              center={pos}
              radius={hoveredPlayerId === player.id ? 7 : 5}
              pathOptions={{
                color: '#0b0d10',
                weight: 1,
                fillColor: color,
                fillOpacity: 0.95,
              }}
              eventHandlers={{
                mouseover: () => onHoverPlayer(player.id),
                mouseout: () => onHoverPlayer(null),
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                {player.isBot ? 'Bot' : 'Human'} · {shortId(player.id, 10)}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {visibleEvents.map((e, i) => (
          <CircleMarker
            key={`evt-${e.type}-${e.userId}-${e.t}-${i}`}
            center={[e.py, e.px]}
            radius={e.type === 'loot' ? 3 : 5}
            pathOptions={{
              color: '#0b0d10',
              weight: 1,
              fillColor: EVENT_COLORS[e.type],
              fillOpacity: 0.9,
            }}
          >
            <Tooltip>
              {e.type.toUpperCase()} · {shortId(e.userId, 10)} · t={Math.round(e.t)}s
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
