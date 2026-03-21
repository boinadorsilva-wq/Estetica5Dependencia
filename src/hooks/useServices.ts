import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Service } from '../../types';

let globalServicesCache: Service[] | null = null;

export function useServices() {
    const [services, setServices] = useState<Service[]>(globalServicesCache ?? []);
    const [loading, setLoading] = useState(true);

    const fetchServices = async () => {
        console.log('[useServices] SELECT obrigatório no SWR');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                const { data: refreshed } = await supabase.auth.refreshSession();
                if (!refreshed.session?.user) {
                    setLoading(false);
                    return;
                }
            }

            const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: false });

            console.log('[useServices] Dados recebidos:', data, 'Erro:', error);
            if (data && !error) console.log('Tabela Services carregou:', data);

            if (error) {
                console.warn('[useServices] Erro ao buscar serviços - mantendo dados antigos:', error);
            } else if (data) {
                const mapped: Service[] = data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    duration: Number(item.duration),
                    value: Number(item.value),
                    type: item.type
                }));
                globalServicesCache = mapped;
                setServices(mapped);
            }
        } catch (err) {
            console.warn('[useServices] Exceção na busca - mantendo cache', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();

        const channelName = 'services_' + Math.random().toString(36).substring(7);
        const subscription = supabase
            .channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
                fetchServices();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const addService = async (serviceData: Omit<Service, 'id'>) => {
        // Atualização Otimista
        const tempId = Math.random().toString(36).substring(7);
        const optimisticService = { ...serviceData, id: tempId } as Service;
        setServices(prev => [optimisticService, ...prev]);

        const { data, error } = await supabase.from('services').insert([{
            name: serviceData.name,
            duration: serviceData.duration,
            value: serviceData.value,
            type: serviceData.type
        }]).select().single();

        if (error) {
            console.error('Erro ao adicionar serviço:', error);
            // Reverte a atualização otimista em caso de erro
            setServices(prev => prev.filter(s => s.id !== tempId));
            throw error;
        }

        // Substituir o item temporário pelo do banco
        setServices(prev => prev.map(s => s.id === tempId ? data : s));
        return data;
    };

    const updateService = async (id: string, serviceData: Partial<Service>) => {
        // Atualização otimista imediata no estado local
        setServices(prev => prev.map(s =>
            s.id === id ? { ...s, ...serviceData } : s
        ));

        const { data, error } = await supabase.from('services').update({
            name: serviceData.name,
            duration: serviceData.duration,
            value: serviceData.value,
            type: serviceData.type
        }).eq('id', id).select().single();

        if (error) {
            console.error('Erro ao atualizar serviço:', error);
            // Reverte em caso de erro fazendo um refetch
            fetchServices();
            throw error;
        }

        // Confirma com o dado real do banco (IDs, etc.)
        if (data) {
            setServices(prev => prev.map(s => s.id === id ? {
                id: data.id,
                name: data.name,
                duration: Number(data.duration),
                value: Number(data.value),
                type: data.type
            } : s));
        }

        return data;
    };

    const deleteService = async (id: string) => {
        const { error } = await supabase.from('services').delete().eq('id', id);

        if (error) {
            console.error('Erro ao excluir serviço:', error);
            throw error;
        }
    };

    return { services, loading, addService, updateService, deleteService, refreshServices: fetchServices };
}
