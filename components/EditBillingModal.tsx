// components/EditBillingModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Billing, Customer, Equipment } from '../types';
import { safeParseFloat } from '../utils';
import { AlertIcon } from './icons/AlertIcon';
import { XIcon } from './icons/XIcon';


interface EditBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (billing: Billing) => void;
  billing: Billing | null;
  customers: Customer[];
  billings: Billing[]; // To check for next billing
}

const FormField: React.FC<{ label: string; id: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; readOnly?: boolean; inputMode?: any; autoFocus?: boolean; }> = 
({ label, id, value, onChange, type = 'text', readOnly = false, inputMode, autoFocus }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <input
            id={id}
            name={id}
            type={type}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            inputMode={inputMode}
            autoFocus={autoFocus}
            className={`w-full bg-slate-700 border rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 ${readOnly ? 'bg-slate-600 cursor-not-allowed' : ''}`}
        />
    </div>
);


const EditBillingModal: React.FC<EditBillingModalProps> = ({ isOpen, onClose, onConfirm, billing: initialBilling, customers, billings }) => {
    const [editedBilling, setEditedBilling] = useState<Partial<Billing>>(initialBilling || {});
    const [error, setError] = useState('');

    const customer = useMemo(() => customers.find(c => c.id === initialBilling?.customerId), [customers, initialBilling]);
    const equipment = useMemo(() => customer?.equipment.find(e => e.id === initialBilling?.equipmentId), [customer, initialBilling]);

    useEffect(() => {
        if (isOpen && initialBilling) {
            setEditedBilling(initialBilling);
            setError('');
        } else {
            setEditedBilling({});
        }
    }, [isOpen, initialBilling]);

    const nextBillingForEquipment = useMemo(() => {
        if (!initialBilling) return null;
        return billings
            .filter(b => b.equipmentId === initialBilling.equipmentId && new Date(b.settledAt) > new Date(initialBilling.settledAt))
            .sort((a,b) => new Date(a.settledAt).getTime() - new Date(b.settledAt).getTime())[0];
    }, [billings, initialBilling]);

    const isRelogioAtualInvalid = useMemo(() => {
        if (nextBillingForEquipment && editedBilling.relogioAtual !== undefined) {
            return editedBilling.relogioAtual > nextBillingForEquipment.relogioAnterior;
        }
        return false;
    }, [editedBilling.relogioAtual, nextBillingForEquipment]);

    const calculation = useMemo(() => {
        if (!equipment) return {};

        const relogioAnterior = editedBilling.relogioAnterior ?? 0;
        const relogioAtual = editedBilling.relogioAtual ?? 0;
        const partidasJogadas = Math.max(0, relogioAtual - relogioAnterior);

        let result: Partial<Billing> = { partidasJogadas, relogioAnterior, relogioAtual };

        if (equipment.type === 'mesa') {
            if (editedBilling.tipoCobranca === 'monthly') {
                result.valorTotal = equipment.mensalidade || 0;
            } else {
                const partidasDescontadas = editedBilling.partidasDescontadas || 0;
                const partidasPagas = Math.max(0, partidasJogadas - partidasDescontadas);
                const valorFicha = equipment.valorFicha || 0;
                const valorBruto = partidasPagas * valorFicha;
                const parteFirma = (valorBruto * (equipment.parteFirma || 0)) / 100;
                const parteCliente = valorBruto - parteFirma;
                result = { ...result, partidasDescontadas, partidasPagas, valorBruto, parteFirma, parteCliente, valorTotal: parteFirma };
            }
        } else if (equipment.type === 'jukebox') {
            const valorBruto = editedBilling.valorBruto || 0;
            const parteFirma = (valorBruto * (equipment.porcentagemJukeboxFirma || 0)) / 100;
            const parteCliente = valorBruto - parteFirma;
            result = { ...result, valorBruto, parteFirma, parteCliente, valorTotal: parteFirma };
        } else if (equipment.type === 'grua') {
            result.valorTotal = initialBilling?.valorTotal || 0;
        }
        
        return result;

    }, [editedBilling, equipment, initialBilling]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = name === 'valorBruto' || name === 'relogioAtual' || name === 'partidasDescontadas' || name === 'recebimentoEspecie' || name === 'recebimentoPix' ? safeParseFloat(value) : value;

        setEditedBilling(prev => {
            const updated = { ...prev, [name]: numericValue };
            
            if (prev.equipmentType === 'grua') {
                const totalFirma = prev.valorTotal || 0;
                if (name === 'recebimentoEspecie') {
                    updated.recebimentoPix = totalFirma - (numericValue as number);
                } else if (name === 'recebimentoPix') {
                    updated.recebimentoEspecie = totalFirma - (numericValue as number);
                }
            }
            return updated;
        });
    };
    
    const handleConfirm = useCallback(() => {
        setError('');
        if (!editedBilling || !initialBilling) return;
        
        if(editedBilling.relogioAtual !== undefined && editedBilling.relogioAtual < initialBilling.relogioAnterior) {
            setError(`A leitura atual não pode ser menor que a leitura anterior (${initialBilling.relogioAnterior}).`);
            return;
        }
        
        if (isRelogioAtualInvalid && nextBillingForEquipment) {
            setError(`A leitura atual não pode ser maior que a leitura anterior da próxima cobrança (${nextBillingForEquipment.relogioAnterior}).`);
            return;
        }

        const finalBilling: Billing = { ...initialBilling, ...editedBilling, ...calculation } as Billing;

        if (finalBilling.equipmentType === 'grua') {
            const recebimentoEspecie = finalBilling.recebimentoEspecie || 0;
            const recebimentoPix = finalBilling.recebimentoPix || 0;
            if (Math.abs(recebimentoEspecie + recebimentoPix - finalBilling.valorTotal) > 0.01) {
                setError("A soma dos pagamentos para Grua não corresponde ao total da firma.");
                return;
            }
        } else if (finalBilling.equipmentType === 'jukebox') {
            if (finalBilling.valorBruto === undefined || finalBilling.valorBruto <= 0) {
                setError("O valor bruto da Jukebox deve ser maior que zero.");
                return;
            }
        }

        onConfirm(finalBilling);
    }, [onConfirm, editedBilling, initialBilling, calculation, isRelogioAtualInvalid, nextBillingForEquipment]);

    if (!isOpen || !initialBilling || !equipment) return null;
    
    const renderMesaForm = () => (
        <div className="space-y-4">
            <FormField id="relogioAtual" label="Leitura Atual" value={editedBilling.relogioAtual ?? ''} onChange={handleFormChange} type="text" inputMode="numeric" autoFocus />
            {isRelogioAtualInvalid && <p className="text-xs text-amber-400">Atenção: A leitura atual é maior que a leitura inicial da próxima cobrança. Isso pode indicar um erro.</p>}
            {editedBilling.tipoCobranca === 'perPlay' && (
                <FormField id="partidasDescontadas" label="Partidas de Desconto" value={editedBilling.partidasDescontadas ?? ''} onChange={handleFormChange} type="text" inputMode="numeric" />
            )}
            
            <div className="p-4 bg-slate-900/50 rounded-lg space-y-2 text-sm">
                <h4 className="font-bold text-lime-400 mb-2">Recálculo</h4>
                <div className="flex justify-between"><span>Partidas Jogadas:</span> <span className="font-mono">{calculation.partidasJogadas ?? 0}</span></div>
                {editedBilling.tipoCobranca === 'perPlay' && <div className="flex justify-between"><span>Partidas Pagas:</span> <span className="font-mono">{calculation.partidasPagas ?? 0}</span></div>}
                {editedBilling.tipoCobranca === 'perPlay' && <div className="flex justify-between"><span>Valor Bruto:</span> <span className="font-mono">R$ {(calculation.valorBruto || 0).toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-lime-400 border-t border-slate-700 pt-2 mt-2"><span>Novo Total (Firma):</span> <span className="font-mono">R$ {(calculation.valorTotal || 0).toFixed(2)}</span></div>
            </div>
        </div>
    );

    const renderGruaForm = () => (
        <div className="space-y-4">
            <p className="text-sm text-slate-400">Apenas o método de pagamento pode ser editado para cobranças de grua.</p>
            <div className="p-4 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm">Total (Firma)</p>
                <p className="font-mono font-bold text-lime-400 text-xl">R$ {(initialBilling.valorTotal || 0).toFixed(2)}</p>
            </div>
            <FormField id="recebimentoEspecie" label="Recebido em Espécie (R$)" value={editedBilling.recebimentoEspecie ?? ''} onChange={handleFormChange} type="text" inputMode="decimal" />
            <FormField id="recebimentoPix" label="Recebido em PIX (R$)" value={editedBilling.recebimentoPix ?? ''} onChange={handleFormChange} type="text" inputMode="decimal" />
        </div>
    );
    
    const renderJukeboxForm = () => (
        <div className="space-y-4">
            <FormField id="valorBruto" label="Valor Bruto (R$)" value={editedBilling.valorBruto ?? ''} onChange={handleFormChange} type="text" inputMode="decimal" autoFocus />
            <div className="p-4 bg-slate-900/50 rounded-lg space-y-2 text-sm">
                <h4 className="font-bold text-lime-400 mb-2">Recálculo</h4>
                <div className="flex justify-between"><span>Parte Cliente ({equipment?.porcentagemJukeboxCliente}%):</span> <span className="font-mono">R$ {(calculation.parteCliente || 0).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lime-400"><span>Parte Firma ({equipment?.porcentagemJukeboxFirma}%):</span> <span className="font-mono">R$ {(calculation.valorTotal || 0).toFixed(2)}</span></div>
            </div>
        </div>
    );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Editar Cobrança - <span className="capitalize">{equipment.type}</span></h2>
                    <p className="text-slate-400 break-words">{customer?.name} - Nº {equipment.numero}</p>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white"><XIcon className="w-6 h-6"/></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
                {error && <div className="mb-4 text-center text-sm p-3 rounded-md bg-red-900/50 text-red-300 flex items-center gap-2"><AlertIcon className="w-5 h-5"/>{error}</div>}
                {equipment.type === 'mesa' && renderMesaForm()}
                {equipment.type === 'grua' && renderGruaForm()}
                {equipment.type === 'jukebox' && renderJukeboxForm()}
            </div>
            <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
                <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Cancelar</button>
                <button onClick={handleConfirm} disabled={!!error} className="bg-lime-500 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-600 disabled:bg-slate-500 disabled:cursor-not-allowed">Salvar Alterações</button>
            </div>
        </div>
         <style>{`
          @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
        `}</style>
    </div>
  );
};

export default EditBillingModal;
