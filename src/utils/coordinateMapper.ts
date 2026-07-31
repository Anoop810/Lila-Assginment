import type { MapConfig } from '../types';

/**
 * Convert world (x, z) → minimap pixel coordinates.
 * Game Y is elevation; top-down maps use X/Z only.
 *
 *   u = (worldX - originX) / scale
 *   v = (worldZ - originZ) / scale
 *   pixelX = u * imageSize
 *   pixelY = (1 - v) * imageSize   // flip Y (image origin is top-left)
 */
export function worldToPixel(
  worldX: number,
  worldZ: number,
  config: MapConfig,
): { x: number; y: number } {
  const u = (worldX - config.originX) / config.scale;
  const v = (worldZ - config.originZ) / config.scale;
  return {
    x: u * config.size,
    y: (1 - v) * config.size,
  };
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function formatDateLabel(dateKey: string): string {
  return dateKey.replace('February_', 'Feb ');
}

export function formatMapLabel(mapId: string): string {
  return mapId
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace('AmbroseValley', 'Ambrose Valley')
    .replace('GrandRift', 'Grand Rift');
}

export function shortId(id: string, len = 8): string {
  if (id.length <= len) return id;
  return `${id.slice(0, len)}…`;
}

export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
