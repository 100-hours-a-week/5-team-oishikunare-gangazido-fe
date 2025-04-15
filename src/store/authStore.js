import { create } from 'zustand';
import { getUserInfo } from '../api/user';

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

export default useAuthStore; 