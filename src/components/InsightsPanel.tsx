const INSIGHTS = [
  {
    id: 'combat-hotspots',
    title: 'Combat clusters on POIs',
    hook: '31% of Ambrose kills sit in just 5 hotspot cells; top 10% of cells hold ~41%.',
    why: 'Players converge on the same reward pockets, so combat is a consequence of economy placement — not random map noise.',
    evidence: [
      'Hottest cell Ambrose (8,8): 143 kills + 420 loot',
      '90.6% of kills within ~80px of a loot event',
      'Traffic heatmaps overlap the same kill pockets',
    ],
    action:
      'Redistribute high-tier loot / add secondary objectives — then re-check Kills + Loot layers.',
    tryInTool: 'Ambrose → Heatmap: Kills → enable Loot → scrub a long match',
  },
  {
    id: 'storm-endgame',
    title: 'Storm hits late only',
    hook: '100% of storm deaths (39) occur in the final third of the match.',
    why: 'Storm only reaches players who already survived ~2× longer than average. Combat ends most lobbies before storm matters.',
    evidence: [
      'Median storm death at ~99.9% of match duration',
      'Avg duration with storm death ~752s vs ~391s without',
      '77% of storm deaths toward map center vs 23% edge',
    ],
    action:
      'Decide if storm should force mid-game rotation or only sweep endgame — timing/damage targets differ.',
    tryInTool: 'Events: Storm only → open a long match → jump timeline to the end',
  },
  {
    id: 'human-vs-bot',
    title: 'Humans and bots diverge',
    hook: 'Humans path farther (~905px vs ~727px) and only 7 of the top 20 path cells overlap bots.',
    why: 'Bots patrol different pockets than where humans loot and fight, so bot density under-serves real engagement zones.',
    evidence: [
      '2,235 human-attributed kills vs 183 bot-attributed',
      'Humans peak at Ambrose (8,8); bots at (4,10)/(5,9)',
      'Toggle Humans/Bots filters to compare trails live',
    ],
    action:
      'Retarget bot patrols toward human traffic and cold flanks; raise randomness and spawn density from heatmaps.',
    tryInTool: 'Toggle Humans/Bots → Heatmap: Traffic on Ambrose Valley',
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
