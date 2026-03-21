
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Home } from './components/Home/Home';
import { Agenda } from './components/Agenda/Agenda';
import { Patients } from './components/Patients/Patients';
import { PatientDetail } from './components/Patients/PatientDetail';
import { Services } from './components/Services/Services';
import { Finance } from './components/Finance/Finance';
import { Admin } from './components/Admin/Admin';
import { Evaluations } from './components/Evaluations/Evaluations';
import { Reports } from './components/Reports/Reports';
import { Login } from './components/Auth/Login';
import { PublicScheduling } from './components/PublicScheduling/PublicScheduling';
import { MeuPerfil } from './components/Profile/MeuPerfil';
import { Crm } from './src/pages/Crm';
import { User, UserRole, Patient } from './types';
import { usePatients } from './src/hooks/usePatients';
import { useAppointments } from './src/hooks/useAppointments';
import { ClinicProvider, useClinic } from './src/context/ClinicContext';
import { supabase } from './src/lib/supabase';
import { prefetchPatients } from './src/hooks/usePatients';
import { prefetchAppointments } from './src/hooks/useAppointments';
import { prefetchClinicSettings } from './src/hooks/useClinicSettings';

// ─── Inner App (needs ClinicContext) ─────────────────────────────────────────
const AppInner: React.FC<{ user: User; onLogout: () => void; onUserUpdated: (u: User) => void }> = ({ user, onLogout, onUserUpdated }) => {
  const { hasPermission } = useClinic();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const { patients, setPatients } = usePatients();
  const { appointments } = useAppointments();

  // Protege a troca de aba: se não tem permissão, redireciona para home
  const handleTabChange = (tab: string) => {
    // 'perfil' é sempre acessível para todos os cargos
    if (tab !== 'perfil' && !hasPermission(tab)) {
      setActiveTab('home');
      return;
    }
    setActiveTab(tab);
    setSelectedPatientId(null);
  };

  // Monitora mudanças de activeTab para garantir proteção contínua
  useEffect(() => {
    if (activeTab !== 'home' && activeTab !== 'perfil' && !hasPermission(activeTab)) {
      setActiveTab('home');
    }
  }, [activeTab, hasPermission]);

  const renderContent = () => {
    if (selectedPatientId) {
      const realPatientData = patients.find(p => p.id === selectedPatientId);
      if (!realPatientData) return (
        <div className="flex-1 flex flex-col items-center justify-center h-full animate-in fade-in duration-500">
          <div className="w-16 h-16 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Sincronizando Cliente</h2>
          <p className="text-slate-500 font-medium">Aguardando confirmação do banco de dados...</p>
        </div>
      );

      const patientAppointments = appointments.filter(a => a.patientId === selectedPatientId);
      const patientDataWithPhysio = { ...realPatientData, physioResponsible: 'Clinica Geral' };

      return (
        <PatientDetail
          patientId={selectedPatientId}
          onBack={() => setSelectedPatientId(null)}
          patientData={patientDataWithPhysio}
          appointments={patientAppointments}
          user={user}
          onSave={(updatedPatientData) => {
            setPatients(prev => prev.map(p =>
              p.id === selectedPatientId ? { ...p, ...updatedPatientData } : p
            ));
          }}
        />
      );
    }

    switch (activeTab) {
      case 'home': return <Home onNavigateToPatient={(id) => { setActiveTab('pacientes'); setSelectedPatientId(id); }} />;
      case 'crm': return hasPermission('crm') ? <Crm /> : null;
      case 'agenda': return hasPermission('agenda') ? <Agenda
        user={user}
        onNavigateToPatient={(id) => { setActiveTab('pacientes'); setSelectedPatientId(id); }}
        onPatientCreated={(newPatient) => {
          setPatients(prev => prev.find(p => p.id === newPatient.id) ? prev : [...prev, newPatient]);
        }}
      /> : null;
      case 'pacientes': return hasPermission('pacientes') ? <Patients onSelectPatient={setSelectedPatientId} user={user} /> : null;
      case 'avaliacoes': return <Evaluations user={user} onNavigateToPatient={(id) => { setActiveTab('pacientes'); setSelectedPatientId(id); }} />;
      case 'relatorios': return hasPermission('relatorios') ? <Reports user={user} /> : null;
      case 'servicos': return hasPermission('servicos') ? <Services user={user} /> : null;
      case 'financeiro': return hasPermission('financeiro') ? <Finance user={user} /> : null;
      case 'admin': return hasPermission('admin') ? <Admin user={user} /> : null;
      case 'perfil': return <MeuPerfil user={user} onUserUpdated={onUserUpdated} />;
      default: return <Home onNavigateToPatient={(id) => { setActiveTab('pacientes'); setSelectedPatientId(id); }} />;
    }
  };

  return (
    <Layout
      user={user}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={onLogout}
      appointments={appointments}
      patients={patients}
      onSelectPatient={(id) => {
        setActiveTab('pacientes');
        setSelectedPatientId(id);
      }}
    >
      {renderContent()}
    </Layout>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.ADMIN);
  const [currentRoute, setCurrentRoute] = useState(window.location.hash);
  // ✅ Flag para evitar race condition: hooks só rodam após auth confirmada
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const handleHashChange = () => setCurrentRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Restaura sessão e sincroniza perfil atualizado do banco e escuta mudanças de Auth
  useEffect(() => {
    // 0. Pré-carregar logo e settings para login rápido
    prefetchClinicSettings().catch(() => {});

    // 1. Restaura imediatamente do localStorage para carregar a UI rápido (Fallback local)
    const savedUser = localStorage.getItem('fisiopro_user');
    if (savedUser) {
      const parsed: User = JSON.parse(savedUser);
      setUser(parsed);
      setCurrentUser(parsed);
      const metaRole = (parsed as any).metaRole as string;
      if (metaRole === 'receptionist') setUserRole(UserRole.RECEPTIONIST);
      else if (metaRole === 'professional') setUserRole(UserRole.PROFESSIONAL);
      else setUserRole(UserRole.ADMIN);
    }

    // 2. Inscreve o App no estado de autenticação para reatividade absoluta (SIGNED_IN, USER_UPDATED, INITIAL_SESSION)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[App] Auth Event [${event}]:`, session?.user);
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user) {
        setIsAuthReady(true);
        
        const meta = session.user.user_metadata;
        const metaRole = meta?.role as string;

        try {
          // 1. Busca perfil vitalício no banco PRYMARY PRIORITY
          const profileResponse = await supabase.from('profiles').select('avatar_url, full_name, role').eq('id', session.user.id).single();
          
          // 2. Pré-carregamentos secundários não-bloqueantes
          Promise.all([
            prefetchPatients(),
            prefetchAppointments(),
            prefetchClinicSettings()
          ]).catch(e => console.error("Falha silenciosa nos prefetches:", e));

          const profile = profileResponse.data;

          const resolvedAvatar = profile?.avatar_url || meta?.avatar_url || '';
          const resolvedName = profile?.full_name || meta?.name || session.user.email?.split('@')[0] || 'Usuário';
          const resolvedRoleStr = profile?.role || metaRole;

          if (resolvedRoleStr === 'receptionist') setUserRole(UserRole.RECEPTIONIST);
          else if (resolvedRoleStr === 'professional') setUserRole(UserRole.PROFESSIONAL);
          else setUserRole(UserRole.ADMIN);

          const syncedUser: User = {
            id: session.user.id,
            name: resolvedName,
            email: session.user.email || '',
            role: resolvedRoleStr === 'receptionist' ? UserRole.RECEPTIONIST 
                : resolvedRoleStr === 'professional' ? UserRole.PROFESSIONAL 
                : UserRole.ADMIN,
            clinicId: 'clinic-123',
            avatar: resolvedAvatar,
            ...(resolvedRoleStr ? { metaRole: resolvedRoleStr } as any : {}),
          } as any;

          setCurrentUser(syncedUser);
          setUser(syncedUser);
          // Persiste localmente a atualização oficial pra o próximo relogado ser instantâneo
          localStorage.setItem('fisiopro_user', JSON.stringify(syncedUser));

        } catch (err) {
          console.error("Erro na sincronização de perfil pós Auth Change:", err);
        }
      } else if (event === 'SIGNED_OUT') {
        // ✅ Prevenção de Silent Logout:
        // Token pode expirar transitoriamente. Tenta refresh antes de limpar tudo.
        try {
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshed.session?.user) {
            // Refresh funcionou — não era um logout real, ignora o evento
            console.info('[Auth] Token renovado automaticamente — silent logout prevenido.');
            return;
          }
        } catch (_) {
          // Se refresh falhar, é um logout legítimo
        }
        setUser(null);
        setCurrentUser(null);
        setUserRole(UserRole.ADMIN);
        localStorage.removeItem('fisiopro_user');
        setIsAuthReady(true);
      } else if (!session?.user) {
        // ✅ Se chegou INITIAL_SESSION ou outro evento e NÃO há sessão no Supabase,
        // limpa a sessão "fantasma" do localStorage que estava forçando a UI renderizar vazia.
        console.warn('[App] Supabase sem sessão válida. Limpando sessão fantasma local.');
        setUser(null);
        setCurrentUser(null);
        localStorage.removeItem('fisiopro_user');
        setIsAuthReady(true);
      } else {
        // Para qualquer outro evento de auth não mapeado
        setIsAuthReady(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setCurrentUser(u);
    const role = (u as any).metaRole as string;
    if (role === 'receptionist') setUserRole(UserRole.RECEPTIONIST);
    else if (role === 'professional') setUserRole(UserRole.PROFESSIONAL);
    else setUserRole(UserRole.ADMIN);

    localStorage.setItem('fisiopro_user', JSON.stringify(u));
    window.location.hash = '#home';
  };

  // Atualiza o usuário loado em tempo real após edição de perfil
  const handleUserUpdated = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUser(updatedUser);
    localStorage.setItem('fisiopro_user', JSON.stringify(updatedUser));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentUser(null);
    setUserRole(UserRole.ADMIN);
    localStorage.removeItem('fisiopro_user');
    window.location.hash = '#login';
  };

  // Rota pública de agendamento
  if (currentRoute === '#agendamento' || currentRoute === '' || currentRoute === '#' || currentRoute === '#/') {
    return <PublicScheduling />;
  }

  // Não autenticado → Login
  if (!user || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // Logado e em #login → redireciona para home
  if (currentRoute === '#login') {
    window.location.hash = '#home';
    return null;
  }

  return (
    <ClinicProvider initialRole={userRole}>
      <AppInner user={currentUser} onLogout={handleLogout} onUserUpdated={handleUserUpdated} />
    </ClinicProvider>
  );
};

export default App;
