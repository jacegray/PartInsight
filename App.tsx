
import React, { createContext, useContext, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { UserContextType, Profile, UserRole } from './types';
import { ADMIN_EMAIL } from './constants';
import { LogOut, ClipboardList, LayoutDashboard, User, Loader2 } from 'lucide-react';

// Pages
import LoginPage from './pages/Login';
import SurveyPage from './pages/Survey';
import AdminPage from './pages/Admin';
import Home from './pages/Home';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};

const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>('USER');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Profile Fetch Error:', error);
        return null;
      }
      return data;
    } catch (e) {
      console.error('fetchProfile exception:', e);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          setRole(currentUser.email === ADMIN_EMAIL ? 'ADMIN' : 'USER');
          const profileData = await fetchProfile(currentUser.id);
          if (isMounted) setProfile(profileData);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        setRole(currentUser.email === ADMIN_EMAIL ? 'ADMIN' : 'USER');
        const profileData = await fetchProfile(currentUser.id);
        if (isMounted) setProfile(profileData);
      } else {
        setProfile(null);
        setRole('USER');
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    try {
      // 1. Supabase 로그아웃 실행
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      // 2. 서버 응답 여부와 관계없이 로컬 상태 강제 초기화
      setUser(null);
      setProfile(null);
      setRole('USER');
      setIsLoading(false);
      // 3. 로그인 페이지로 즉시 이동 (Replace를 사용하여 히스토리 방지)
      navigate('/login', { replace: true });
    }
  };

  return (
    <UserContext.Provider value={{ user, profile, role, isLoading, signOut }}>
      {children}
    </UserContext.Provider>
  );
};

const Navbar: React.FC = () => {
  const { user, profile, role, signOut } = useUser();

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl">
              <ClipboardList className="w-6 h-6" />
              <span className="hidden sm:inline">Part Insight</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {role === 'ADMIN' && (
              <Link to="/admin" className="text-slate-600 hover:text-indigo-600 flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                <span>관리자 대시보드</span>
              </Link>
            )}
            <div className="flex items-center space-x-2 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium">{profile?.name || user.email?.split('@')[0] || '사용자'}</span>
            </div>
            <button
              onClick={signOut}
              className="text-slate-500 hover:text-red-600 transition-colors p-2 focus:outline-none"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; roleRequired?: UserRole }> = ({ children, roleRequired }) => {
  const { user, role, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-medium animate-pulse">정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <UserProvider>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/survey" element={<ProtectedRoute><SurveyPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roleRequired="ADMIN"><AdminPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </UserProvider>
    </HashRouter>
  );
};

export default App;
