// ─────────────────────────────────────────────────────────────────────────────
// Arquitetura: UMA tabela 'leads' com coluna 'status'.
// Drag & drop → apenas UPDATE no campo status.
// Realtime → canal único ouvindo toda a tabela.
// ─────────────────────────────────────────────────────────────────────────────

/** Valores exatos do campo 'status' no banco */
export type LeadStatus =
    | 'triagem'
    | 'duvidas'
    | 'indecisos'
    | 'falar_dra'
    | 'agendados';

/** Representa um registro da tabela 'leads' */
export interface Lead {
    id: string;
    nome: string | null;
    telefone: string;
    status: LeadStatus;
    mensagem: string | null;
    updated_at?: string;
    agendamento_status?: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO' | null;
}

/** Rótulo legível para cada coluna do Kanban */
export const COLUMN_LABEL: Record<LeadStatus, string> = {
    triagem: 'Triagem',
    duvidas: 'Dúvidas',
    indecisos: 'Indecisos',
    falar_dra: 'Falar com a Dra',
    agendados: 'Agendados',
};

/** Ordem das colunas no Kanban */
export const BOARD_COLUMNS: LeadStatus[] = [
    'triagem',
    'duvidas',
    'indecisos',
    'falar_dra',
    'agendados',
];

/** Paleta visual por coluna */
export const COLUMN_COLORS: Record<LeadStatus, {
    bg: string;
    badge: string;
    dot: string;
    ring: string;
}> = {
    triagem: { bg: 'bg-slate-100/70 border-slate-200/60', badge: 'bg-slate-200 text-slate-600', dot: 'bg-slate-400', ring: 'ring-slate-300' },
    duvidas: { bg: 'bg-yellow-50/70 border-yellow-200/50', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400', ring: 'ring-yellow-300' },
    indecisos: { bg: 'bg-orange-50/70 border-orange-200/50', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400', ring: 'ring-orange-300' },
    falar_dra: { bg: 'bg-purple-50/70 border-purple-200/50', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400', ring: 'ring-purple-300' },
    agendados: { bg: 'bg-green-50/70 border-green-200/50', badge: 'bg-green-100 text-green-700', dot: 'bg-green-400', ring: 'ring-green-300' },
};

/**
 * Normaliza qualquer valor vindo do n8n para um LeadStatus válido.
 * Tolerante a maiúsculas, acentos e variações.
 */
export const normalizeStatus = (raw: string | null | undefined): LeadStatus => {
    if (!raw) return 'triagem';
    const s = raw.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (s === 'triagem') return 'triagem';
    if (s === 'duvidas' || s === 'dúvidas') return 'duvidas';
    if (s === 'indecisos') return 'indecisos';
    if (s.includes('falar') || s === 'falar_dra') return 'falar_dra';
    if (s === 'agendados') return 'agendados';
    return 'triagem'; // fallback seguro
};
