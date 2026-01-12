
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../App';
import { SURVEY_QUESTIONS } from '../constants';
import { Check, Send, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const SurveyPage: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // 기본 답변 상태
  const [answers, setAnswers] = useState<any>({
    q1: '',
    q2: [],
    q3: '',
    q4: [],
    q5: ''
  });

  // '기타' 입력값 전용 상태
  const [otherInputs, setOtherInputs] = useState({
    q2: '',
    q4: ''
  });

  useEffect(() => {
    let isMounted = true;
    const fetchExisting = async () => {
      if (!user) {
        if (isMounted) setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('survey_responses')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (isMounted && data) {
          // DB 데이터를 UI용 상태로 변환 (기타: 내용 -> 기타)
          const parseMulti = (arr: string[], key: 'q2' | 'q4') => {
            let otherVal = '';
            const cleaned = arr.map(val => {
              if (val.startsWith('기타: ')) {
                otherVal = val.replace('기타: ', '');
                return '기타';
              }
              return val;
            });
            return { cleaned, otherVal };
          };

          const q2Parsed = parseMulti(data.q2 || [], 'q2');
          const q4Parsed = parseMulti(data.q4 || [], 'q4');

          setAnswers({
            q1: data.q1,
            q2: q2Parsed.cleaned,
            q3: data.q3,
            q4: q4Parsed.cleaned,
            q5: data.q5 || ''
          });

          setOtherInputs({
            q2: q2Parsed.otherVal,
            q4: q4Parsed.otherVal
          });

          setHasSubmitted(true);
        }
      } catch (err) {
        console.error('Fetch Survey Error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchExisting();
    return () => { isMounted = false; };
  }, [user]);

  const handleSingleSelect = (questionId: string, value: string) => {
    if (hasSubmitted) return;
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleMultiSelect = (questionId: string, value: string) => {
    if (hasSubmitted) return;
    const current = answers[questionId] as string[];
    let next: string[];
    
    if (current.includes(value)) {
      next = current.filter(v => v !== value);
      // '기타' 해제 시 텍스트도 초기화
      if (value === '기타') {
        setOtherInputs(prev => ({ ...prev, [questionId]: '' }));
      }
    } else {
      next = [...current, value];
    }
    setAnswers({ ...answers, [questionId]: next });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || hasSubmitted) return;

    if (!answers.q1 || !answers.q3 || answers.q2.length === 0 || answers.q4.length === 0) {
      alert('필수 문항에 답변해주세요.');
      return;
    }

    // 데이터 결합 (기타 선택 시 입력값 포함)
    const finalizeMulti = (arr: string[], otherVal: string) => {
      return arr.map(val => (val === '기타' && otherVal.trim() ? `기타: ${otherVal.trim()}` : val));
    };

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('survey_responses').insert([
        { 
          user_id: user.id,
          q1: answers.q1,
          q2: finalizeMulti(answers.q2, otherInputs.q2),
          q3: answers.q3,
          q4: finalizeMulti(answers.q4, otherInputs.q4),
          q5: answers.q5
        }
      ]);
      
      if (error) throw error;
      
      setHasSubmitted(true);
      alert('설문이 성공적으로 제출되었습니다.');
      navigate('/');
    } catch (err: any) {
      alert('제출 중 오류가 발생했습니다: ' + (err.message || '네트워크 상태를 확인해주세요.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex flex-col justify-center items-center min-h-[50vh]">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
      <p className="text-slate-500 font-medium">설문 내용을 불러오고 있습니다...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link to="/" className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        <span>홈으로</span>
      </Link>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">검사파트 설문</h1>
        <p className="text-slate-500 font-medium text-lg">부담 없이 답변 해주세요.</p>
        {hasSubmitted && (
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 text-sm flex items-center">
            <Check className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>이미 제출된 설문입니다. 수정은 관리자에게 문의하세요.</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Q1 */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-start">
            <span className="bg-indigo-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</span>
            {SURVEY_QUESTIONS.q1.label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SURVEY_QUESTIONS.q1.options.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleSingleSelect('q1', option)}
                disabled={hasSubmitted}
                className={`text-left px-5 py-4 rounded-2xl border-2 transition-all ${
                  answers.q1 === option
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'
                } ${hasSubmitted ? 'opacity-80' : 'active:scale-[0.98]'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* Q2 */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-start">
            <span className="bg-indigo-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</span>
            {SURVEY_QUESTIONS.q2.label}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {SURVEY_QUESTIONS.q2.options.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleMultiSelect('q2', option)}
                disabled={hasSubmitted}
                className={`text-left px-4 py-4 rounded-2xl border-2 transition-all flex items-center space-x-2 ${
                  answers.q2.includes(option)
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'
                } ${hasSubmitted ? 'opacity-80' : 'active:scale-[0.98]'}`}
              >
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                  answers.q2.includes(option) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
                }`}>
                  {answers.q2.includes(option) && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                </div>
                <span>{option}</span>
              </button>
            ))}
          </div>
          
          {answers.q2.includes('기타') && (
            <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center space-x-2 mb-2 text-indigo-600 text-sm font-semibold ml-1">
                <MessageCircle className="w-4 h-4" />
                <span>기타 키워드를 입력해주세요</span>
              </div>
              <input
                type="text"
                value={otherInputs.q2}
                onChange={(e) => setOtherInputs({ ...otherInputs, q2: e.target.value })}
                disabled={hasSubmitted}
                placeholder="예: 프로젝트 완수, 동료와의 즐거운 커피 타임 등"
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all text-slate-700 placeholder:text-slate-400 font-medium"
              />
            </div>
          )}
        </section>

        {/* Q3 */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-start">
            <span className="bg-indigo-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</span>
            {SURVEY_QUESTIONS.q3.label}
          </h2>
          <div className="space-y-3">
            {SURVEY_QUESTIONS.q3.options.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleSingleSelect('q3', option)}
                disabled={hasSubmitted}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all ${
                  answers.q3 === option
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'
                } ${hasSubmitted ? 'opacity-80' : 'active:scale-[0.98]'}`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* Q4 */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-start">
            <span className="bg-indigo-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">4</span>
            {SURVEY_QUESTIONS.q4.label}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {SURVEY_QUESTIONS.q4.options.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleMultiSelect('q4', option)}
                disabled={hasSubmitted}
                className={`text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center space-x-3 ${
                  answers.q4.includes(option)
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'
                } ${hasSubmitted ? 'opacity-80' : 'active:scale-[0.98]'}`}
              >
                 <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${
                  answers.q4.includes(option) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
                }`}>
                  {answers.q4.includes(option) && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                </div>
                <span>{option}</span>
              </button>
            ))}
          </div>

          {answers.q4.includes('기타') && (
            <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center space-x-2 mb-2 text-indigo-600 text-sm font-semibold ml-1">
                <MessageCircle className="w-4 h-4" />
                <span>건의사항을 구체적으로 입력해주세요</span>
              </div>
              <input
                type="text"
                value={otherInputs.q4}
                onChange={(e) => setOtherInputs({ ...otherInputs, q4: e.target.value })}
                disabled={hasSubmitted}
                placeholder="어떤 점을 개선하면 좋을까요?"
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all text-slate-700 placeholder:text-slate-400 font-medium"
              />
            </div>
          )}
        </section>

        {/* Q5 */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-start">
            <span className="bg-indigo-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">5</span>
            {SURVEY_QUESTIONS.q5.label}
          </h2>
          <p className="text-sm text-slate-500 mb-6 ml-9">배우고 싶은 기술, 기억나는 업무 등 자유롭게 적어주세요. (선택)</p>
          <textarea
            value={answers.q5}
            onChange={(e) => setAnswers({ ...answers, q5: e.target.value })}
            disabled={hasSubmitted}
            placeholder={SURVEY_QUESTIONS.q5.placeholder}
            className="w-full h-40 px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none transition-all resize-none text-slate-700 placeholder:text-slate-400 font-medium leading-relaxed"
          />
        </section>

        {!hasSubmitted && (
          <div className="pt-4 pb-12">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold py-5 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 active:scale-[0.99]"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Send className="w-6 h-6" />
                  <span>설문 완료하고 제출하기</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SurveyPage;
