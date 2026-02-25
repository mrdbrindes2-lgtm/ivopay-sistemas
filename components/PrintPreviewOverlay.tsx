
// components/PrintPreviewOverlay.tsx
import React, { useEffect } from 'react';
import { Customer } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';
import CustomerSheet from './CustomerSheet';

interface PrintPreviewOverlayProps {
  customer: Customer;
  onCancel: () => void;
}

const PrintPreviewOverlay: React.FC<PrintPreviewOverlayProps> = ({ customer, onCancel }) => {
  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    // Add event listener for when printing is done (or cancelled)
    window.addEventListener('afterprint', onCancel);
    
    // Give the browser a moment to render before printing
    const timer = setTimeout(() => {
        handlePrint();
    }, 100);


    // Cleanup
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', onCancel);
    };
  }, [onCancel]);

  return (
    <div className="print-overlay fixed inset-0 bg-slate-200 dark:bg-slate-900 z-[100] flex flex-col">
       <style>{`
        @media print {
          body > #root > *:not(.print-overlay) {
            display: none;
          }
          body > .print-overlay {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <header className="print-controls no-print sticky top-0 bg-white/90 dark:bg-slate-800/90 p-4 shadow-md flex justify-center gap-4 flex-shrink-0">
        <button onClick={onCancel} className="bg-slate-500 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-400">
          Cancelar
        </button>
        <button onClick={handlePrint} className="bg-[var(--color-primary)] text-[var(--color-primary-text)] font-bold py-2 px-6 rounded-md hover:bg-[var(--color-primary-hover)] flex items-center gap-2">
          <PrinterIcon className="w-5 h-5" />
          Salvar PDF / Imprimir
        </button>
      </header>
      <div className="print-content overflow-y-auto flex-grow">
        <CustomerSheet customer={customer} />
      </div>
    </div>
  );
};

export default PrintPreviewOverlay;
