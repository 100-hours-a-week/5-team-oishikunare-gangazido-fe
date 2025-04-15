import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom, loadingAtom } from '../atoms/authAtoms';

// 인증이 필요한 라우트를 위한 컴포넌트
function ProtectedRoute() {
  // jotai atoms에서 상태 가져오기
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const loading = useAtomValue(loadingAtom);
  const navigate = useNavigate();

  // 컴포넌트 마운트 시 인증 상태 확인 (추가적인 검증)
  useEffect(() => {
    // 이미 인증 상태가 아니라면 즉시 리다이렉트
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // 로딩 중인 경우 스피너 표시
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-amber-50">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-amber-800 border-t-transparent"></div>
        <p className="mt-4 text-amber-800 font-medium">사용자 인증 확인 중...</p>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute; 