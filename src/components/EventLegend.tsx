export function EventLegend() {
  return (
    <section className="panel legend-panel">
      <h2>Legend</h2>
      <ul className="legend-list">
        <li>
          <span className="swatch kill" /> Kill
        </li>
        <li>
          <span className="swatch death" /> Death
        </li>
        <li>
          <span className="swatch loot" /> Loot
        </li>
        <li>
          <span className="swatch storm" /> Storm
        </li>
        <li>
          <span className="swatch human" /> Human path
        </li>
        <li>
          <span className="swatch bot" /> Bot path
        </li>
      </ul>
      <p className="hint">Space play/pause · F focus map</p>
    </section>
  );
}
