
export interface Profile {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface SurveyResponse {
  id: number;
  user_id: string;
  q1: string;
  q2: string[];
  q3: string;
  q4: string[];
  q5: string; // 추가된 서술형 문항
  created_at: string;
  profiles?: Profile; // For joined queries
}

export type UserRole = 'USER' | 'ADMIN';

export interface UserContextType {
  user: any | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  signOut: () => Promise<void>;
}
