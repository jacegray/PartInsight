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

  // 사용자 및 프로필 상태를 업데이트하는 함수 (백그라운드 실행용)
  const updateUserStates = async (currentUser: any) => {
    if (!currentUser) {
      setUser(null);
      setProfile(null);
      setRole('USER');
      return;
    }

    setUser(currentUser);
    setRole(currentUser.email === ADMIN_EMAIL ? 'ADMIN' : 'USER');

    try {
      // 1. 가입 시 저장한 메타데이터가 있다면 즉시 프로필에 임시 반영 (이름 깨짐 방지)
      if (currentUser.user_metadata?.name || currentUser.user_metadata?.full_name) {
        setProfile({
          name: currentUser.user_metadata.name || currentUser.user_metadata.full_name,
          email: currentUser.email,
          id: currentUser.id,
        } as Profile);
      }

      // 2. 실제 DB에서 최신 프로필 정보 가져오기
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();
      
      if (!error && data) {
        setProfile(data);
      }
    } catch (e) {
      console.error('Profile fetch background failed:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          if (session?.user) {
            // [중요] await를 붙이지 않습니다. 프로필 조회를 기다리지 않고 로딩을 풉니다.
            updateUserStates(session.user); 
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (isMounted) {
          console.log("Auth initialized. Releasing loader.");
          setIsLoading(false); // 무조건 실행되어 무한 로딩 방지
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event Trace:", event);
      if (!isMounted) return;

      if (session?.user) {
        updateUserStates(session.user); // await 제거
      } else {
        updateUserStates(null);
      }
      
      // 세션 관련 이벤트가 발생했다는 것은 로딩을 끝내도 된다는 신호입니다.
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      updateUserStates(null);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
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

  // 이름 표시 우선순위 (ueca1b... 방지)
  const displayName = profile?.name || user.user_metadata?.name || user.user_metadata?.full_name || "사용자";

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
              <span className="text-xs font-bold text-indigo-600">{displayName}</span>
            </div>
            <button
              onClick={signOut}
              className="text-slate-500 hover:text-red-600 transition-colors p-2 focus:outline-none"
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

  // isLoading이 true인 동안에만 이 화면이 보입니다.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-slate-500 font-medium animate-pulse">인증 세션을 확인 중입니다...</p>
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