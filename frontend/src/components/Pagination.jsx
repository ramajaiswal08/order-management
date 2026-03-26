import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn btn-secondary"
        style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
      >
        <ChevronLeft size={18} />
      </button>
      
      <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>
        Page {page} of {pages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="btn btn-secondary"
        style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Pagination;
