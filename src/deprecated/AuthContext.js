import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getUserInfo } from '../api/user';

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 인증 컨텍스트 사용을 위한 훅 생성
export const useAuth = () => useContext(AuthContext);

// 인증 상태 제공자 컴포넌트
export const AuthProvider = ({ children }) => {
  // 사용자 정보 상태
  const [user, setUser] = useState(null);
  // 로딩 상태
  const [loading, setLoading] = useState(true);

  // 인증 상태 확인 함수 (재사용성을 위해 useCallback으로 감싸기)
  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    try {
      // 사용자 정보 요청
      const response = await getUserInfo();
      // 사용자 정보가 있으면 인증 상태로 설정
      if (response.data?.data) {
        setUser(response.data.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 오류 발생 시 인증되지 않은 상태로 설정
      setUser(null);
    } finally {
      setLoading(false); // 로딩 완료
    }
  }, []);

  // 컴포넌트 마운트 시 사용자 인증 상태 확인
  useEffect(() => {
    checkAuthStatus();
    
    // 주기적으로 인증 상태 확인 (5분마다)
    const intervalId = setInterval(() => {
      checkAuthStatus();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [checkAuthStatus]);

  // 로그인 함수
  const login = (userData) => {
    if (!userData) {
      return;
    }
    setUser(userData);
  };

  // 로그아웃 함수
  const logout = () => {
    setUser(null);
    // 로컬 스토리지에서 사용자 관련 데이터 제거
    localStorage.removeItem('user');
  };

  // 인증 상태 새로고침 함수
  const refreshAuthStatus = async () => {
    await checkAuthStatus();
  };

  // 컨텍스트 값
  const value = {
    user,
    isAuthenticated: !!user, // 사용자가 있으면 true, 없으면 false
    loading,
    login,
    logout,
    refreshAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 