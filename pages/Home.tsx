import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUser } from '../App';
import { SURVEY_QUESTIONS } from '../constants';
import { FileText, CheckCircle2, ArrowRight, Calendar, Info, Loader2, BarChart3, PieChart, Activity, Lock, MessageSquare } from 'lucide-react';

interface StatItem {
  label: string;
  count: number;
  percent: number;
}

interface QuestionStats {
  q1: StatItem[];
  q2: StatItem[];
  q3: StatItem[];
  q4: StatItem[];
}

const Home: React.FC = () => {
  const { user, profile } = useUser();
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allStats, setAllStats] = useState<QuestionStats | null>(null);
  const [subjectiveResponses, setSubjectiveResponses] = useState<string[]>([]);
  const [otherOpinions, setOtherOpinions] = useState<{question: string, text: string}[]>([]);

  // 현재 로그인한 사용자가 'admin'인지 확인
  const isAdmin = profile?.name === 'admin' || user?.user_metadata?.name === 'admin';
  const isMultiChoice = true;

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        // 1. 내 응답 여부 확인 (모든 유저 공통)
        const { data: myResponse } = await supabase
          .from('survey_responses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (isMounted) setHasResponded(!!myResponse);

        // 2. 관리자(admin)일 때만 통계 데이터 가져오기
        if (isAdmin || isMultiChoice) {
          const { data: allResponses, error: statsError } = await supabase
            .from('survey_responses')
            .select('q1, q2, q3, q4, q5');

          if (statsError) throw statsError;

          if (isMounted && allResponses) {
            const totalRespondents = allResponses.length;

            const calculateStats = (questionKey: 'q1' | 'q2' | 'q3' | 'q4') => {
              const counts: { [key: string]: number } = {};
              const options = SURVEY_QUESTIONS[questionKey].options;
              options.forEach(opt => counts[opt] = 0);
              counts["기타"] = 0;

              // [추가] Q2, Q4에서 '기타: ...' 형태의 답변만 추출
              const extractedOthers: {question: string, text: string}[] = [];

              allResponses.forEach(r => {
                const val = r[questionKey];
                if (Array.isArray(val)) {
                  val.forEach(v => {
                    const baseVal = v.startsWith('기타: ') ? '기타' : v;
                    if (counts[baseVal] !== undefined) counts[baseVal]++;
                  });
                } else {
                  if (counts[val] !== undefined) counts[val]++;
                }

                // Q2 검사 (키워드)
                r.q2?.forEach((val: string) => {
                  if (val.startsWith('기타: ')) {
                    extractedOthers.push({ question: '기본 키워드 기타', text: val.replace('기타: ', '') });
                  }
                });
                
                // Q4 검사 (업무 환경)
                r.q4?.forEach((val: string) => {
                  if (val.startsWith('기타: ')) {
                    extractedOthers.push({ question: '개선 사항 기타', text: val.replace('기타: ', '') });
                  }
                });
              });
              
              setOtherOpinions(extractedOthers);

              // 서술형 답변 필터링 (빈 값 제외)
              const q5Answers = allResponses
                .map(r => r.q5)
                .filter(ans => ans && ans.trim().length > 0);
              setSubjectiveResponses(q5Answers);

              return options.map(opt => ({
                label: opt,
                count: counts[opt],
                percent: totalRespondents > 0 ? Math.round((counts[opt] / totalRespondents) * 100) : 0
              })).sort((a, b) => b.count - a.count);
            };

            setAllStats({
              q1: calculateStats('q1'),
              q2: calculateStats('q2'),
              q3: calculateStats('q3'),
              q4: calculateStats('q4'),
            });
          }
        }
      } catch (err) {
        console.error('Home Data Fetch Error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [user, isAdmin, isMultiChoice]); // isAdmin 조건 추가

  const StatCard = ({ title, icon: Icon, data, colorClass }: { title: string, icon: any, data: StatItem[], colorClass: string }) => (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center space-x-2 mb-6">
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
      </div>
      <div className="space-y-4">
        {data.slice(0, 5).map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-600 truncate max-w-[180px]">{item.label}</span>
              <span className="text-slate-400">{item.percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${colorClass.replace('text-', 'bg-')}`}
                style={{ width: `${item.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
      <p className="text-slate-500 font-medium">데이터 로드 중...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-200 mb-8">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-12 text-white relative">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-3">안녕하세요, {profile?.name || 'ㅇㅇ'}님 👋</h1>
            <p className="text-indigo-100 text-lg opacity-90">
              더 나은 업무 환경을 위해 준비한 설문조사입니다. 
              <br/>지난 한 해를 돌아보고 새해의 목표를 함께 공유해주세요.
            </p>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start space-x-4">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">제출 기한</h3>
                <p className="text-sm text-slate-500">2025.01.20(화) 까지</p>
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

          {hasResponded ? (
            <div className="space-y-10">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">설문 참여 완료</h2>
                <p className="text-slate-500 font-medium">참여해주셔서 감사합니다. {isAdmin ? '실시간 통계를 확인하세요.' : ''}</p>
              </div>

              {/* 통계 그리드: isAdmin일 때만 노출 or 객관형 노출(isMultiChoice) 허용 일 때 */}
              {isAdmin && allStats || isMultiChoice ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard title="현재 느끼는 업무 강도" icon={Activity} data={allStats.q1} colorClass="text-rose-500" />
                  <StatCard title="지난해 기억에 남는 키워드" icon={BarChart3} data={allStats.q2} colorClass="text-indigo-600" />
                  <StatCard title="올해의 목표" icon={PieChart} data={allStats.q3} colorClass="text-amber-500" />
                  <StatCard title="개선이 필요한 업무 환경" icon={FileText} data={allStats.q4} colorClass="text-emerald-500" />
                </div>
              ) : hasResponded && (
                <div className="hidden bg-slate-50 rounded-3xl p-8 border border-slate-100 text-center">
                  <Lock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">통계 데이터는 관리자에게만 공개됩니다.</p>
                </div>
              )}

              {/* 통계 그리드 하단에 추가 */}
              {isAdmin && (otherOpinions.length > 0 || subjectiveResponses.length > 0) && (
                <div className="mt-16 space-y-10">
                  <div className="border-t border-slate-200 pt-10">
                    <div className="flex items-center space-x-2 mb-6">
                      <MessageSquare className="w-6 h-6 text-indigo-600" />
                      <h3 className="font-bold text-slate-800 text-xl">파트원들의 상세 의견</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Q2, Q4의 기타 의견들 */}
                      {otherOpinions.map((item, idx) => (
                        <div key={`other-${idx}`} className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-sm relative group">
                          <span className="absolute top-3 right-4 text-[10px] font-bold text-amber-500 bg-white px-2 py-0.5 rounded-full border border-amber-100">
                            {item.question}
                          </span>
                          <p className="text-slate-700 text-sm leading-relaxed mt-2 italic">
                            "{item.text}"
                          </p>
                        </div>
                      ))}

                      {/* Q5 자유 서술형 답변들 */}
                      {subjectiveResponses.map((text, idx) => (
                        <div key={`q5-${idx}`} className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100 shadow-sm relative group">
                          <span className="absolute top-3 right-4 text-[10px] font-bold text-indigo-500 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                            자유 의견
                          </span>
                          <p className="text-slate-700 text-sm leading-relaxed mt-2 whitespace-pre-wrap">
                            "{text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Link to="/survey" className="flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg">
                  <span>내 응답 수정하기</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center text-center space-y-6">
              <div className="p-6 bg-indigo-50 rounded-[2rem] text-indigo-600">
                <FileText className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">아직 설문에 참여하지 않으셨습니다.</h2>
                <p className="text-slate-500 font-medium">지금 바로 설문을 시작하시겠습니까?</p>
              </div>
              <Link to="/survey" className="flex items-center space-x-3 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95">
                <span>설문 시작하기</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;