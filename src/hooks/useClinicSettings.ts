import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ClinicSettings, DEFAULT_CLINIC_SETTINGS } from '../../types';

// ── Cache global SWR ───────────────────────────────────────────────────────────
export let globalClinicSettingsCache: ClinicSettings | null = null;

function mapSettings(data: any): ClinicSettings {
    return {
        id: data.id,
        clinic_name: data.clinic_name || DEFAULT_CLINIC_SETTINGS.clinic_name,
        logo_url: data.logo_url,
        primary_color: data.primary_color || DEFAULT_CLINIC_SETTINGS.primary_color,
        permissions: {
            receptionist: {
                ...DEFAULT_CLINIC_SETTINGS.permissions.receptionist,
                ...(data.permissions?.receptionist || {}),
            },
            professional: {
                ...DEFAULT_CLINIC_SETTINGS.permissions.professional,
                ...(data.permissions?.professional || {}),
            },
        },
    };
}

export const prefetchClinicSettings = async () => {
    try {
        const { data, error } = await supabase
            .from('clinic_settings')
            .select('*')
            .limit(1)
            .maybeSingle();
        if (!error && data) {
            globalClinicSettingsCache = mapSettings(data);
        }
    } catch (err) {
        // Silencioso
    }
};

export const useClinicSettings = () => {
    const [settings, setSettings] = useState<ClinicSettings>(
        globalClinicSettingsCache ?? DEFAULT_CLINIC_SETTINGS
    );
    const [loading, setLoading] = useState(globalClinicSettingsCache === null);
    const [saving, setSaving] = useState(false);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('clinic_settings')
                    .select('*')
                    .limit(1)
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') {
                    console.warn('[useClinicSettings] Erro ao buscar — mantendo settings existentes:', error.message);
                    if (isMountedRef.current) setLoading(false);
                    return;
                }

                if (data && isMountedRef.current) {
                    const newSettings = mapSettings(data);
                    globalClinicSettingsCache = newSettings;
                    setSettings(newSettings);
                }
            } catch (err) {
                console.warn('[useClinicSettings] Erro inesperado:', err);
            } finally {
                if (isMountedRef.current) setLoading(false);
            }
        };

        if (!globalClinicSettingsCache) {
            fetchSettings();
        } else {
            setLoading(false);
        }
    }, []);

    const saveSettings = async (partial: Partial<ClinicSettings>) => {
        setSaving(true);
        try {
            const merged = { ...settings, ...partial };

            const payload = {
                clinic_name: merged.clinic_name,
                logo_url: merged.logo_url ?? null,
                primary_color: merged.primary_color ?? null,
                permissions: merged.permissions,
            };
            // Se o settings já possui ID, adicionamos no payload para o upsert não duplicar a linha
            const finalPayload = merged.id ? { id: merged.id, ...payload } : payload;

            const result = await supabase
                .from('clinic_settings')
                .upsert(finalPayload, { onConflict: 'id' }) // Faz UPDATE se achar o ID, INSERT se não achar
                .select()
                .single();

            if (result.error) {
                throw result.error;
            }

            if (result.data && isMountedRef.current) {
                const saved = mapSettings(result.data);
                globalClinicSettingsCache = saved;
                setSettings(saved);
            }

            return true;
        } catch (err) {
            console.error('Erro inesperado ao salvar configurações:', err);
            return false;
        } finally {
            if (isMountedRef.current) setSaving(false);
        }
    };

    return { settings, loading, saving, saveSettings };
};
