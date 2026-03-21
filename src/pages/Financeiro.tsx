import React, { useState, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    ChevronDown
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { format, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

const PERIODS = {
    'HOJE': 0,
    '7D': 7,
    '30D': 30,
    '90D': 90,
} as const;

type PeriodKey = keyof typeof PERIODS | 'CUSTOM';

export const Financeiro = () => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true) }, []);
    const [period, setPeriod] = useState<PeriodKey>('30D');
    
    const dateFrom = React.useMemo(() => {
        if (period === 'CUSTOM') return undefined;
        const startDate = subDays(new Date(), PERIODS[period]);
        return format(startDate, 'yyyy-MM-dd');
    }, [period]);

    const { transactions, addTransaction } = useTransactions({ dateFrom });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        description: '',
        amount: '',
        type: 'RECEITA' as 'RECEITA' | 'DESPESA',
        category: '',
        date: format(new Date(), 'yyyy-MM-dd')
    });

    const income = transactions
        .filter(t => t.type === 'RECEITA')
        .reduce((acc, t) => acc + Number(t.value), 0);

    const expense = transactions
        .filter(t => t.type === 'DESPESA')
        .reduce((acc, t) => acc + Number(t.value), 0);

    const balance = income - expense;

    // Prepare chart data (Dynamic based on period)
    const chartDays = period === 'CUSTOM' ? 30 : (PERIODS[period] === 0 ? 1 : PERIODS[period]);
    // For large periods (90 days), we might want to group, but given simplicity, we map per day
    const chartData = Array.from({ length: Math.min(chartDays, 30) }).map((_, i) => {
        const lengthToUse = Math.min(chartDays, 30);
        const date = subDays(new Date(), lengthToUse - 1 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayTransactions = transactions.filter(t => t.date === dateStr);

        return {
            name: format(date, 'dd/MM'),
            receita: dayTransactions.filter(t => t.type === 'RECEITA').reduce((acc, t) => acc + Number(t.value), 0),
            despesa: dayTransactions.filter(t => t.type === 'DESPESA').reduce((acc, t) => acc + Number(t.value), 0),
        };
    });

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addTransaction({
                description: newTransaction.description,
                value: Number(newTransaction.amount),
                type: newTransaction.type,
                notes: newTransaction.category,
                date: newTransaction.date,
                method: 'Diversos',
                patient: 'N/A',
                status: 'CONCLUÍDO'
            });
            setIsModalOpen(false);
            setNewTransaction({
                description: '',
                amount: '',
                type: 'RECEITA',
                category: '',
                date: format(new Date(), 'yyyy-MM-dd')
            });
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar transação');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Financeiro</h1>
                    <p className="text-slate-500 font-medium">Fluxo de caixa e controle financeiro.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    {/* Period Selector */}
                    <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                        {(Object.keys(PERIODS) as PeriodKey[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-bold rounded-lg transition-colors",
                                    period === p
                                        ? "bg-slate-100 text-slate-800"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {p === 'HOJE' ? 'Hoje' : p.replace('D', ' dias')}
                            </button>
                        ))}
                        <button
                            onClick={() => setPeriod('CUSTOM')}
                            className={cn(
                                "px-4 py-1.5 text-sm font-bold rounded-lg transition-colors flex items-center gap-1",
                                period === 'CUSTOM'
                                    ? "bg-slate-100 text-slate-800"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Personalizado <ChevronDown size={14} />
                        </button>
                    </div>

                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="mr-2" size={20} />
                        Nova Transação
                    </Button>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-brand flex items-center justify-center">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Saldo Total</span>
                    </div>
                    <p className={cn("text-3xl font-black", balance >= 0 ? "text-slate-800" : "text-red-500")}>
                        {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Receitas</span>
                    </div>
                    <p className="text-3xl font-black text-green-600">
                        {income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                            <TrendingDown size={20} />
                        </div>
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Despesas</span>
                    </div>
                    <p className="text-3xl font-black text-red-500">
                        {expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                <div className="lg:col-span-2 bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Fluxo de Caixa (7 dias)</h3>
                    <div className="flex-1 w-full min-h-0">
                        {isMounted && (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(value) => `R$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="receita"
                                    stroke="var(--primary-color)"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorReceita)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="despesa"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorDespesa)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Recent Transactions List */}
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Transações Recentes</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {transactions.slice().reverse().map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center",
                                        t.type === 'RECEITA' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"
                                    )}>
                                        {t.type === 'RECEITA' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{t.description}</p>
                                        <p className="text-xs text-slate-400 font-medium">{t.notes || t.patient || 'Sem Categoria'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "text-sm font-bold",
                                        t.type === 'RECEITA' ? "text-green-600" : "text-red-500"
                                    )}>
                                        {t.type === 'RECEITA' ? '+' : '-'}{Number(t.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                    <p className="text-xs text-slate-400">{format(parseISO(t.date || new Date().toISOString()), 'dd/MM')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nova Transação"
            >
                <form onSubmit={handleAddTransaction} className="space-y-4">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                        <button
                            type="button"
                            onClick={() => setNewTransaction({ ...newTransaction, type: 'RECEITA' })}
                            className={cn(
                                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                                newTransaction.type === 'RECEITA' ? "bg-white text-green-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Receita
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewTransaction({ ...newTransaction, type: 'DESPESA' })}
                            className={cn(
                                "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                                newTransaction.type === 'DESPESA' ? "bg-white text-red-500 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Despesa
                        </button>
                    </div>

                    <Input
                        label="Descrição"
                        placeholder="Ex: Consulta Particular"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Valor (R$)"
                            type="number"
                            placeholder="0,00"
                            value={newTransaction.amount}
                            onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                            required
                        />
                        <Input
                            label="Data"
                            type="date"
                            value={newTransaction.date}
                            onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        label="Categoria"
                        placeholder="Ex: Aluguel, Equipamentos..."
                        value={newTransaction.category}
                        onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                        required
                    />

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant={newTransaction.type === 'RECEITA' ? 'primary' : 'danger'} className="flex-1">
                            {newTransaction.type === 'RECEITA' ? 'Receber' : 'Pagar'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
