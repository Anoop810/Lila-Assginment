import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface Props {
  points: Array<[number, number, number]>;
}

export function HeatmapLayer({ points }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const layer = L.heatLayer(points, {
      radius: 22,
      blur: 18,
      maxZoom: 2,
      minOpacity: 0.35,
      gradient: {
        0.2: '#1d4ed8',
        0.45: '#22c55e',
        0.7: '#eab308',
        1.0: '#ef4444',
      },
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}
