
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Navigate } from 'react-router-dom';
import { useUser } from '../App';
import { LogIn, UserPlus, Lock, User as UserIcon, AlertCircle, Settings, CheckCircle2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupDisabled, setSignupDisabled] = useState(false);
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const mapNameToEmail = (userName: string) => {
    const trimmedName = userName.trim();
    if (!trimmedName) return '';
    const encoder = new TextEncoder();
    const data = encoder.encode(trimmedName);
    const hex = Array.from(data)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `u${hex}@survey-system.com`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setSignupDisabled(false);

    const internalEmail = mapNameToEmail(name);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email: internalEmail, 
          password 
        });
        if (signInError) throw signInError;
        navigate('/');
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
          email: internalEmail, 
          password,
          options: { 
            data: { name: name.trim() },
            emailRedirectTo: window.location.origin 
          }
        });
        
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('이미 등록된 이름입니다. 로그인 모드에서 로그인을 진행해주세요.');
            setIsLogin(true);
            setLoading(false);
            return;
          }
          if (signUpError.message.toLowerCase().includes('disabled') || signUpError.status === 403) {
            setSignupDisabled(true);
            throw new Error('Supabase 설정에서 이메일 가입 기능이 비활성화되어 있습니다.');
          }
          throw signUpError;
        }

        if (signUpData.user) {
          await supabase.from('profiles').upsert([
            { id: signUpData.user.id, email: internalEmail, name: name.trim() }
          ]);
        }

        if (!signUpData.session) {
          const { error: retryError } = await supabase.auth.signInWithPassword({ 
            email: internalEmail, 
            password 
          });
          if (retryError) {
            setError('가입은 완료되었으나 로그인이 되지 않았습니다.');
            setIsLogin(true);
            setLoading(false);
            return;
          }
        }
        navigate('/');
      }
    } catch (err: any) {
      console.error('Auth Error Detailed:', err);
      if (err.message.includes('confirm')) {
        setError('이메일 인증이 필요합니다.');
      } else if (err.message.includes('Invalid login')) {
        setError('이름 또는 비밀번호가 일치하지 않습니다.');
      } else {
        setError(err.message || '인증 과정에서 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4">
            {isLogin ? <LogIn className="w-8 h-8 text-indigo-600" /> : <UserPlus className="w-8 h-8 text-indigo-600" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{isLogin ? '로그인' : '새로운 시작, 회원가입'}</h1>
          <p className="text-slate-500 mt-2 text-sm">검사파트 설문</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
            <div className="flex items-start space-x-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold mb-1">안내</p>
                <p className="leading-relaxed opacity-90">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">성함</label>
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                placeholder={isLogin ? "가입하신 이름 입력" : "성함 입력"}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">비밀번호</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                placeholder="6자리 이상 비밀번호"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:shadow-none active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span className="text-lg">{isLogin ? '로그인하기' : '회원가입 완료하기'}</span>
            )}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(null); setSignupDisabled(false); }}
            className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors flex items-center justify-center mx-auto space-x-2"
          >
            <span>{isLogin ? '처음이신가요? 계정 만들기' : '이미 계정이 있으신가요? 로그인'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
