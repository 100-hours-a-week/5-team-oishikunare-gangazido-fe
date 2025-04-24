import { create } from 'zustand';
import { getUserInfo } from '../api/user';
import { shallow } from 'zustand/shallow';

// 인증 상태를 관리하는 Zustand 스토어
const useAuthStore = create((set, get) => ({
  // 상태
  user: null,
  loading: true,
  isAuthenticated: false,
  
  // 액션
  checkAuthStatus: async () => {
    set({ loading: true });
    try {
      const response = await getUserInfo();
      if (response.data?.data) {
        set({ 
          user: response.data.data, 
          isAuthenticated: true,
          loading: false
        });
      } else {
        set({ 
          user: null, 
          isAuthenticated: false,
          loading: false
        });
      }
    } catch (err) {
      set({ 
        user: null, 
        isAuthenticated: false,
        loading: false
      });
    }
  },
  
  login: (userData) => {
    if (!userData) return;
    set({ 
      user: userData, 
      isAuthenticated: true 
    });
  },
  
  logout: () => {
    localStorage.removeItem('user');
    set({ 
      user: null, 
      isAuthenticated: false 
    });
  },
  
  refreshAuthStatus: async () => {
    await get().checkAuthStatus();
  },
  
  // 초기화 함수 (앱 시작 시 호출)
  initialize: () => {
    get().checkAuthStatus();
    
    // 주기적으로 인증 상태 확인 (5분마다)
    const intervalId = setInterval(() => {
      get().checkAuthStatus();
    }, 5 * 60 * 1000);
    
    return intervalId;
  }
}));

// 선택자 함수들 - 성능 최적화를 위해 사용 권장
export const useUser = () => useAuthStore(state => state.user);
export const useNickname = () => useAuthStore(state => state.user?.nickname);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useLoading = () => useAuthStore(state => state.loading);

// 객체 타입의 상태에 대한 shallow 비교를 사용한 선택자
export const useUserProfile = () => useAuthStore(state => ({
  name: state.user?.name,
  email: state.user?.email,
  nickname: state.user?.nickname,
  profileImage: state.user?.profileImage
}), shallow);

// 다중 상태 선택을 위한 선택자
export const useAuthStatus = () => useAuthStore(
  state => ({ 
    isAuthenticated: state.isAuthenticated, 
    loading: state.loading 
  }), 
  shallow
);

// 액션만 선택하는 선택자
export const useAuthActions = () => useAuthStore(state => ({
  login: state.login,
  logout: state.logout,
  checkAuthStatus: state.checkAuthStatus,
  refreshAuthStatus: state.refreshAuthStatus,
  initialize: state.initialize
}), shallow);

// 기존 방식도 지원 (필요한 경우에만 사용 권장)
export default useAuthStore;

/*
사용 예시:

// 👎 비효율적인 방식 (전체 상태 구독)
const auth = useAuthStore();
const nickname = auth.user?.nickname;

// 👍 효율적인 방식 (필요한 상태만 구독)
const nickname = useNickname();
const isAuthenticated = useIsAuthenticated();

// 👍 여러 필드가 필요한 경우 (객체로 반환, shallow 비교 사용)
const { name, email } = useUserProfile();

// 👍 액션만 필요한 경우
const { login, logout } = useAuthActions();
*/ 