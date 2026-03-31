export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="af2-pagination">
      <button disabled={page === 1}          onClick={() => onChange(page - 1)}>← Préc.</button>
      <span>Page {page} / {totalPages}</span>
      <button disabled={page === totalPages} onClick={() => onChange(page + 1)}>Suiv. →</button>
    </div>
  );
}