
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SurveyResponse } from '../types';
import { Download, Users, CheckCircle, Search, Clock, Loader2, Trash2, AlertTriangle, X, RefreshCw, MessageSquare, Info } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const fetchResponses = useCallback(async (silent = false) => {
  if (!silent) setLoading(true);
  try {
    const { data, error } = await supabase
      .from('survey_responses')
      .select(`
        id,
        q1, q2, q3, q4, q5,
        created_at,
        user_id,
        profiles (
          name,
          email
        )
      `) // profiles:user_id 대신 profiles로만 적어보세요 (Supabase가 외래키를 자동 인식함)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // 데이터가 제대로 들어오는지 확인용 로그
    console.log("Fetched Data:", data); 
    
    if (data) setResponses(data as any);
  } catch (err) {
    console.error('Admin Fetch Error:', err);
  } finally {
    if (!silent) setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const handleDelete = async () => {
    if (deleteId === null) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('survey_responses')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setResponses(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 3000);
    } catch (err: any) {
      console.error('Delete operation failed:', err);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredResponses = responses.filter(r => 
    r.profiles?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // '기타: 내용' 형태의 답변을 보기 좋게 렌더링
  const renderTag = (text: string, colorClass: string) => {
    const isOther = text.startsWith('기타: ');
    const content = isOther ? text.replace('기타: ', '') : text;
    
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${colorClass} ${isOther ? 'flex items-center' : ''}`}>
        {isOther && <Info className="w-2.5 h-2.5 mr-1" />}
        {content}
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-12 relative">
      {showDeleteSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2 border border-slate-700">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">데이터가 성공적으로 삭제되었습니다.</span>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button onClick={() => setDeleteId(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">응답을 영구 삭제합니까?</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">데이터를 삭제하면 복구할 수 없습니다.</p>
            <div className="flex space-x-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl">취소</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-2xl">{isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '영구 삭제'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">설문 대시보드</h1>
          <p className="text-slate-500 mt-1 font-medium">파트원들의 응답 현황을 관리하세요.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => fetchResponses()} disabled={loading} className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin text-indigo-600' : ''}`} /> 새로고침
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center px-4 py-2 bg-indigo-600 rounded-lg text-sm font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
            <Download className="w-4 h-4 mr-2" /> 결과 출력 (PDF)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Users className="w-5 h-5" /></div></div>
          <div className="text-3xl font-bold text-slate-900">{responses.length}명</div>
          <div className="text-sm text-slate-500 font-medium mt-1">설문 응답 완료</div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2"><div className="p-2 bg-green-50 text-green-600 rounded-xl"><CheckCircle className="w-5 h-5" /></div></div>
          <div className="text-lg font-bold text-slate-900">{responses.length > 0 ? formatDate(responses[0].created_at) : '-'}</div>
          <div className="text-sm text-slate-500 font-medium mt-1">최근 응답 시간</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="파트원 이름 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">업무 강도</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">키워드 (Q2)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">올해 목표</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">건의사항 (Q4)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">기타 의견 (Q5)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && responses.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />데이터 분석 중...</td></tr>
              ) : filteredResponses.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-400 italic font-medium">등록된 설문 응답이 없습니다.</td></tr>
              ) : (
                filteredResponses.map((res) => (
                  <tr key={res.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{res.profiles?.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium flex items-center mt-1"><Clock className="w-3 h-3 mr-1 text-slate-300" />{formatDate(res.created_at)}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${res.q1 === '매우 높음' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>{res.q1}</span>
                    </td>
                    <td className="px-6 py-5 min-w-[150px]">
                      <div className="flex flex-wrap gap-1.5">{res.q2.map((k, i) => renderTag(k, 'bg-slate-100 text-slate-600 border-slate-200/50'))}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap"><span className="text-sm text-slate-700 font-medium">{res.q3}</span></td>
                    <td className="px-6 py-5 min-w-[150px]">
                      <div className="flex flex-wrap gap-1.5">{res.q4.map((k, i) => renderTag(k, 'bg-indigo-50 text-indigo-600 border-indigo-100/50'))}</div>
                    </td>
                    <td className="px-6 py-5 min-w-[180px]">
                      {res.q5 ? (
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-slate-600 leading-relaxed max-h-16 overflow-y-auto font-medium" title={res.q5}>{res.q5}</p>
                        </div>
                      ) : (
                        <span className="text-slate-200 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <button onClick={() => setDeleteId(res.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all md:opacity-0 md:group-hover:opacity-100 active:scale-90" title="응답 삭제"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
