export type MapId = 'AmbroseValley' | 'GrandRift' | 'Lockdown';

export type HeatmapMode = 'none' | 'traffic' | 'kills' | 'deaths';

export type EventType = 'kill' | 'death' | 'loot' | 'storm';

export interface MapConfig {
  scale: number;
  originX: number;
  originZ: number;
  size: number;
}

export interface MatchSummary {
  id: string;
  safeId: string;
  map: MapId;
  date: string;
  duration: number;
  humans: number;
  bots: number;
  kills: number;
  deaths: number;
  loot: number;
  stormDeaths: number;
}

export interface DataIndex {
  generatedAt: string;
  maps: MapId[];
  dates: string[];
  mapConfig: Record<MapId, MapConfig>;
  mapImages: Record<MapId, string>;
  matchCount: number;
  matches: MatchSummary[];
}

export interface PathPoint {
  t: number;
  x: number;
  z: number;
  px: number;
  py: number;
}

export interface Player {
  id: string;
  isBot: boolean;
  path: PathPoint[];
  kills: number;
  deaths: number;
  loot: number;
  stormDeath: boolean;
}

export interface MatchEvent {
  t: number;
  type: EventType;
  px: number;
  py: number;
  userId: string;
  isBot: boolean;
}

export interface MatchData {
  id: string;
  safeId: string;
  map: MapId;
  date: string;
  duration: number;
  players: Player[];
  events: MatchEvent[];
  stats: {
    humans: number;
    bots: number;
    kills: number;
    deaths: number;
    loot: number;
    stormDeaths: number;
  };
}

export interface EventVisibility {
  kill: boolean;
  death: boolean;
  loot: boolean;
  storm: boolean;
}

export interface PlayerVisibility {
  humans: boolean;
  bots: boolean;
}
