const INSIGHTS = [
  {
    id: 'loot-magnet',
    title: 'Loot pulls fights',
    hook: '90.6% of kills happen near loot in the same match.',
    why: 'Players converge on the same reward pockets, so combat is a consequence of economy placement — not random map noise.',
    evidence: [
      '2,190 / 2,418 kills within ~80px of a loot event',
      'Top Ambrose cell (8,8): 143 kills + 420 loot',
      'Deaths skew late (69%) after early/mid looting',
    ],
    action:
      'Tune contested POIs by splitting loot or adding a second approach — then re-check Kills + Loot layers.',
    tryInTool: 'Ambrose → Heatmap: Kills → enable Loot → scrub a long match',
  },
  {
    id: 'storm-endgame',
    title: 'Storm is an endgame filter',
    hook: 'All 39 storm deaths occur in the final third of the match.',
    why: 'Storm only reaches players who already survived ~2× longer than average. Combat ends most lobbies before storm matters.',
    evidence: [
      '39 storm deaths in 796 matches (~5%)',
      '100% of storm kills in late phase',
      'Avg duration with storm death ~752s vs ~391s without',
    ],
    action:
      'Decide if storm should force mid-game rotation or only sweep endgame — timing/damage targets differ.',
    tryInTool: 'Events: Storm only → open a long match → jump timeline to the end',
  },
  {
    id: 'cold-zones',
    title: 'Maps play as corridors',
    hook: 'Only 32–43% of each map grid sees any traffic.',
    why: 'Learned loot/extract routes concentrate movement. Empty space has no job in the loop, so it stays empty.',
    evidence: [
      'Ambrose: 43% cells used; busiest 10% carry 40% of traffic',
      'Lockdown: only 32% of cells touched',
      'Same hot corridors host loot + kills (Insight 1)',
    ],
    action:
      'Move a slice of low-tier loot into cold flanks; success = higher occupied-cell % without spiking old hot POIs.',
    tryInTool: 'Heatmap: Traffic at full duration on each map',
  },
] as const;

export function InsightsPanel() {
  return (
    <section className="panel insights-panel">
      <h2>Insights</h2>
      <p className="insights-intro">
        Not just counts — each finding has a cause you can test in the viewer.
      </p>
      <ol className="insights-list">
        {INSIGHTS.map((insight, i) => (
          <li key={insight.id} className="insight-card">
            <header>
              <span className="insight-index">{i + 1}</span>
              <h3>{insight.title}</h3>
            </header>
            <p className="insight-hook">{insight.hook}</p>
            <p className="insight-why">
              <strong>Why:</strong> {insight.why}
            </p>
            <ul className="insight-evidence">
              {insight.evidence.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="insight-action">
              <strong>Do:</strong> {insight.action}
            </p>
            <p className="insight-try">{insight.tryInTool}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
