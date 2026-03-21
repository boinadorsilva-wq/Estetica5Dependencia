import React, { useState } from 'react';
import { KanbanCard } from './KanbanCard';
import { Lead, LeadStatus, COLUMN_COLORS, COLUMN_LABEL } from '../../types/lead';
import { Users } from 'lucide-react';

interface KanbanColumnProps {
    key?: React.Key;
    status: LeadStatus;
    leads: Lead[];
    onDropCard: (toStatus: LeadStatus, leadId: string) => void;
}

export const KanbanColumn = ({ status, leads, onDropCard }: KanbanColumnProps) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const colors = COLUMN_COLORS[status];

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const leadId = e.dataTransfer.getData('text/plain');
        if (leadId) onDropCard(status, leadId);
    };

    const handleDragStart = (e: React.DragEvent, _id: string) => { /* preenchido no card */ };

    return (
        <div
            className={`flex flex-col rounded-2xl p-4 min-w-[280px] max-w-[280px] border transition-all duration-200
                ${colors.bg}
                ${isDragOver ? `${colors.ring} ring-2 ring-offset-1 scale-[1.01] shadow-lg` : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="font-bold text-slate-700 text-sm">{COLUMN_LABEL[status]}</h3>
                <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${colors.badge}`}>
                    <Users size={10} />
                    {leads.length}
                </span>
            </div>

            {/* Lista de cards */}
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 py-1 pb-2">
                {leads.map((lead) => (
                    <KanbanCard key={lead.id} lead={lead} onDragStart={handleDragStart} />
                ))}

                {leads.length === 0 && (
                    <div className={`flex items-center justify-center h-24 border-2 border-dashed rounded-xl transition-colors ${isDragOver ? 'border-cyan-300 bg-cyan-50/50' : 'border-slate-200'}`}>
                        <span className="text-sm text-slate-400 font-medium">
                            {isDragOver ? '↓ Soltar aqui' : 'Coluna vazia'}
                        </span>
                    </div>
                )}

                {leads.length > 0 && isDragOver && (
                    <div className="h-12 border-2 border-dashed border-cyan-300 bg-cyan-50/50 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-xs text-cyan-500 font-semibold">↓ Mover para cá</span>
                    </div>
                )}
            </div>
        </div>
    );
};
