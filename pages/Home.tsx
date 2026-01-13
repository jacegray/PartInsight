
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUser } from '../App';
import { FileText, CheckCircle2, ArrowRight, Calendar, Info, Loader2 } from 'lucide-react';

const Home: React.FC = () => {
  const { user, profile } = useUser();
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkResponse = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('survey_responses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        if (isMounted) setHasResponded(!!data);
      } catch (err) {
        console.error('Home CheckResponse Error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkResponse();
    return () => { isMounted = false; };
  }, [user]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
      <p className="text-slate-500">상태 확인 중...</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
        <div className="bg-indigo-600 px-8 py-12 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-4">안녕하세요, {profile?.name || '파트원'}님</h1>
            <p className="text-indigo-100 text-lg max-w-xl">
              더 나은 업무 환경을 위해 준비한 설문조사입니다. 
              지난 한 해를 돌아보고 새해의 목표를 함께 공유해주세요.
            </p>
          </div>
          <div className="absolute top-0 right-0 -mr-16 -mt-16 bg-white/10 w-64 h-64 rounded-full blur-3xl"></div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-4">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">제출 기한</h3>
                <p className="text-sm text-slate-500">2025.01.20(월) 까지</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-4">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">소요 시간</h3>
                <p className="text-sm text-slate-500">약 3분~5분 내외</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 flex flex-col items-center">
            {hasResponded ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-2">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">설문 제출 완료</h2>
                <p className="text-slate-500">설문조사에 참여해 주셔서 감사합니다.</p>
                <Link
                  to="/survey"
                  className="inline-flex items-center space-x-2 text-indigo-600 font-medium hover:underline pt-4"
                >
                  <span>내 응답 확인하기</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-2">
                  <FileText className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">아직 설문에 참여하지 않으셨습니다</h2>
                  <p className="text-slate-500">지금 바로 설문을 시작하시겠습니까?</p>
                </div>
                <Link
                  to="/survey"
                  className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                >
                  <span>설문 시작하기</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
