import { atom } from 'jotai';
import { getUserInfo } from '../api/user';

// 사용자 정보 상태
export const userAtom = atom(null);

// 로딩 상태
export const loadingAtom = atom(true);

// 인증 상태
export const isAuthenticatedAtom = atom(
  (get) => !!get(userAtom)
);

// 인증 상태를 확인하는 비동기 atom
export const checkAuthStatusAtom = atom(
  null,
  async (get, set) => {
    set(loadingAtom, true);
    try {
      const response = await getUserInfo();
      if (response.data?.data) {
        set(userAtom, response.data.data);
      } else {
        set(userAtom, null);
      }
    } catch (err) {
      set(userAtom, null);
    } finally {
      set(loadingAtom, false);
    }
  }
);

// 로그인 함수 atom
export const loginAtom = atom(
  null,
  (get, set, userData) => {
    if (!userData) return;
    set(userAtom, userData);
  }
);

// 로그아웃 함수 atom
export const logoutAtom = atom(
  null,
  (get, set) => {
    localStorage.removeItem('user');
    set(userAtom, null);
  }
);

// 인증 상태 초기화 및 주기적 확인 함수
export const initializeAuthAtom = atom(
  null,
  async (get, set) => {
    // 초기 인증 상태 확인
    set(checkAuthStatusAtom);
    
    // 5분마다 인증 상태 확인
    const intervalId = setInterval(() => {
      set(checkAuthStatusAtom);
    }, 5 * 60 * 1000);
    
    return intervalId;
  }
); 