import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useAtomValue, useSetAtom } from 'jotai';
import { isAuthenticatedAtom, loginAtom } from '../atoms/authAtoms';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  console.log(location);
  
  // jotai atoms 사용
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const login = useSetAtom(loginAtom);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/map');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await loginUser({ email, password });
      
      // 응답 구조 확인
      let userData = null;
      
      // response.data 구조 확인
      if (response.data) {
        // data 필드가 있으면 사용
        if (response.data.data) {
          userData = response.data.data;
        } 
        // user 필드가 있으면 사용
        else if (response.data.user) {
          userData = response.data.user;
        }
        // 응답 자체를 사용
        else {
          userData = {
            email: email,
            id: 'user-' + Date.now()
          };
        }
      } else {
        userData = {
          email: email,
          id: 'user-' + Date.now()
        };
      }
      
      login(userData);
      
      // 로그인 성공 후 리디렉션
      navigate('/map');
    } catch (err) {
      console.error('로그인 오류:', err);
      console.error('오류 응답:', err.response?.data);

      const errorCode = err.response?.data?.message;
  
      if (errorCode === 'invalid_email' || errorCode === 'invalid_password') {
        setError('이메일과 비밀번호를 정확히 입력해 주세요.');
      } else if (errorCode === 'invalid_email_format') {
        setError('이메일 형식이 잘못되었습니다.');
      } else {
        // 기타 오류
        setError(err.response?.data?.message || '로그인 중 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigate('/register');
  };

  const goToMap = () => {
    navigate('/map');
  };

  return (
    <div className="flex flex-col h-full bg-amber-50">
      {/* 헤더 - 뒤로가기 버튼 추가 */}
      <header className="bg-white pt-2 pb-0 px-4 shadow-md flex items-center relative">
        <button onClick={goToMap} className="absolute left-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-grow flex justify-center">
          <img
            src="/gangazido-logo-header.png"
            alt="Gangazido Logo Header"
            className="h-14 w-28 object-cover cursor-pointer"
            onClick={goToMap}
          />
        </div>
      </header>

      <div className="flex-1 p-4 flex flex-col">
        <h1 className="text-xl font-bold text-center my-8 text-gray-800">로그인</h1>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* 입력 폼 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                placeholder="이메일을 입력하세요"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-800 text-white p-3 rounded-md text-center font-medium mt-4 disabled:bg-amber-500"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <button
                onClick={goToRegister}
                className="text-amber-800 hover:underline focus:outline-none font-medium"
              >
                회원가입하기
              </button>
            </p>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <img
            src="/gangazido-logo.png"
            alt="Gangazido Logo"
            className="h-20 cursor-pointer"
            onClick={goToMap}
          />
        </div>
      </div>
    </div>
  );
}

export default Login; 