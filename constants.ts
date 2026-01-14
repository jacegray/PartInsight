
// 'admin' 문자열을 헥사 인코딩한 값: 61646d696e
export const ADMIN_EMAIL = 'u61646d696e@survey-system.com';

export const SURVEY_QUESTIONS = {
  q1: {
    id: 'q1',
    label: '작년 업무 강도는 어떠셨나요?',
    type: 'radio',
    options: ['매우 높음', '높음', '보통', '낮음']
  },
  q2: {
    id: 'q2',
    label: '작년 한 해 기억에 남는 키워드를 선택해주세요 (복수 선택 가능)',
    type: 'checkbox',
    options: ['뿌듯함', '어려움', '협업', '성장', '도전', '기타']
  },
  q3: {
    id: 'q3',
    label: '올해의 가장 큰 개인적 목표는 무엇인가요?',
    type: 'radio',
    options: ['직무 역량 강화', '프로젝트 성과 창출', '일과 삶의 균형(워라밸)', '새로운 기술 도전']
  },
  q4: {
    id: 'q4',
    label: '파트 운영 및 환경에 바라는 점을 선택해주세요 (복수 선택 가능)',
    type: 'checkbox',
    options: ['업무 프로세스 개선', '물리적 근무 환경 개선', '기술 가이드라인 수립', '커리어 패스 지원', '기타']
  },
  q5: {
    id: 'q5',
    label: '그 밖에 하고 싶은 말',
    placeholder: '궁금한 점, 건의사항, 배우고 싶은 기술, 기억나는 업무 등 자유롭게 적어주세요. (선택 사항)',
    type: 'textarea'
  }
};
