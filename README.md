<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1uwMbiaKA1ysQxiGsk0Ic1BoZ951zUXPE

## Run Locally

**Prerequisites:**  Node.js version : 22.21.1

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`






# AI Studio Prompt

# Role
너는 Full-stack 개발 전문가야. Next.js (App Router), Tailwind CSS, Supabase를 사용하여 '검사파트 설문 앱'을 만들고 Vercel에 배포할 계획이야.

# App Overview & Brand
- 서비스 명칭: "검사파트 설문" (UI상 서비스명: Part Insight)
- 목적: 파트원 업무 환경 개선 및 신년 목표 공유를 위한 사전 설문 시스템

# Technical Stack & Deployment
- Frontend: Next.js 14+ (App Router), Tailwind CSS, Lucide-react
- Backend: Supabase (Auth, Database)
- Deployment: Vercel (Next.js 환경 최적화)

# Core Features
1. [Auth]: 이름/비밀번호 기반 로그인 및 회원가입. (필드: 이름, 비밀번호)
2. [UI Text]:
   - 메인 타이틀: "검사파트 설문"
   - 설명 문구: "더 나은 업무 환경을 위해 준비한 설문조사입니다. 지난 한 해를 돌아보고 새해의 목표를 함께 공유해주세요."
   - 가이드 문구: "부담 없이 답변 해주세요."

3. [Survey Form 문항 및 로직]:
   - Q1(단일선택): 작년 업무 강도 (4개 보기: 적절 / 가끔 숨가쁨 / 회복 필요 / 도전 원함)
   - Q2(복수선택 + 기타): 작년 기억에 남는 키워드 (뿌듯함, 어려움, 협업, 기타)
     * '기타' 체크 시 텍스트 입력창 노출 및 답변 결합 저장
   - Q3(단일선택): 올해의 개인적 목표 (역량, 성과, 워라밸, 도전)
   - Q4(복수선택 + 기타): 파트장에게 바라는 점 (프로세스 개선, 환경 개선, 가이드, 커리어, 기타)
     * '기타' 체크 시 텍스트 입력창 노출 및 답변 결합 저장
   - Q5(서술형, 선택): 그 밖에 하고 싶은 말 (자유 기입)

4. [Admin]: 'devadmin@example.com' 계정으로 로그인 시 /admin 페이지에서 전체 응답 결과 조회 가능.

# Database Schema (Supabase)
1. profiles: id(uuid, PK), email, name
2. survey_responses: id(int8, PK), user_id(uuid, FK), q1(text), q2(jsonb), q3(text), q4(jsonb), q5(text)

# Requirements for Vercel Deployment
- Vercel에서 빌드 오류가 나지 않도록 'Typescript'나 'ESLint' 설정을 고려한 안정적인 코드를 작성해줘.
- 환경 변수(`.env.local`) 설정 가이드를 포함해줘.
- 데이터 로딩 시 'Loading 스피너'나 '빈 화면 방지' 처리를 포함해줘.

# Deliverables
1. Supabase SQL (테이블 생성용)
2. 전체 폴더 구조 및 소스 코드 (Page, Components, Supabase Client 등)
3. Vercel 배포를 위한 가이드 및 환경 변수 설정법
















