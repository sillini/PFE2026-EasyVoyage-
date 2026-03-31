export default function Breadcrumb({ crumbs }) {
  return (
    <div className="af2-breadcrumb">
      {crumbs.map((c, i) => (
        <span key={i}>
          {i > 0 && <span className="af2-bc-sep">›</span>}
          {c.onClick
            ? <button className="af2-bc-btn" onClick={c.onClick}>{c.label}</button>
            : <span className="af2-bc-current">{c.label}</span>}
        </span>
      ))}
    </div>
  );
}