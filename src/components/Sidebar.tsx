import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { formatDuration, shortId } from '../utils/coordinateMapper';
import type { MatchData } from '../types';

interface Props {
  match: MatchData;
  hoveredPlayerId: string | null;
}

const CHART_COLORS = ['#e5484d', '#f76808', '#f5d90a', '#8e4ec6'];

export function Sidebar({ match, hoveredPlayerId }: Props) {
  const hovered = match.players.find((p) => p.id === hoveredPlayerId);
  const chartData = [
    { name: 'Kills', value: match.stats.kills },
    { name: 'Deaths', value: match.stats.deaths },
    { name: 'Loot', value: match.stats.loot },
    { name: 'Storm', value: match.stats.stormDeaths },
  ];

  return (
    <section className="panel stats-panel">
      <h2>Match summary</h2>
      <div className="stat-grid">
        <div>
          <strong>{match.stats.humans}</strong>
          <span>Humans</span>
        </div>
        <div>
          <strong>{match.stats.bots}</strong>
          <span>Bots</span>
        </div>
        <div>
          <strong>{formatDuration(match.duration)}</strong>
          <span>Duration</span>
        </div>
        <div>
          <strong>{match.stats.kills}</strong>
          <span>Kills</span>
        </div>
        <div>
          <strong>{match.stats.loot}</strong>
          <span>Loot</span>
        </div>
        <div>
          <strong>{match.stats.stormDeaths}</strong>
          <span>Storm deaths</span>
        </div>
      </div>

      <div className="mini-chart">
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: '#8b95a5', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#8b95a5', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: '#1a1f27',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={CHART_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {hovered && (
        <div className="hover-card">
          <h3>{hovered.isBot ? 'Bot' : 'Human'}</h3>
          <p className="mono">{shortId(hovered.id, 18)}</p>
          <ul>
            <li>Path points: {hovered.path.length}</li>
            <li>Kills: {hovered.kills}</li>
            <li>Deaths: {hovered.deaths}</li>
            <li>Loot: {hovered.loot}</li>
            <li>Storm death: {hovered.stormDeath ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      )}
    </section>
  );
}
