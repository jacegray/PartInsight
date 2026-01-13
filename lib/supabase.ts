import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 점검을 위한 로그 추가: 브라우저 콘솔에서 확인 가능합니다.
console.log("URL 연결 확인:", supabaseUrl);
console.log("Key 존재 여부:", !!supabaseAnonKey); 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * [관리자 전용: Supabase RLS 설정 SQL]
 * 아래 쿼리를 Supabase SQL Editor에서 실행해야 삭제 기능이 정상 작동합니다.
 * 
 * -- 1. RLS 활성화
 * ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
 * 
 * -- 2. 삭제 권한 부여 (관리자 전용)
 * CREATE POLICY "Admins can delete responses" 
 * ON public.survey_responses 
 * FOR DELETE 
 * TO authenticated 
 * USING (auth.email() = 'u61646d696e@survey-system.com');
 * 
 * -- 3. 조회 권한 부여 (관리자는 전체, 사용자는 본인 것만)
 * CREATE POLICY "Admins see all, users see own" 
 * ON public.survey_responses 
 * FOR SELECT 
 * TO authenticated 
 * USING (auth.email() = 'u61646d696e@survey-system.com' OR auth.uid() = user_id);
 * 
 * -- 4. 생성 권한 부여 (본인 데이터만)
 * CREATE POLICY "Users can insert own" 
 * ON public.survey_responses 
 * FOR INSERT 
 * TO authenticated 
 * WITH CHECK (auth.uid() = user_id);
 */
