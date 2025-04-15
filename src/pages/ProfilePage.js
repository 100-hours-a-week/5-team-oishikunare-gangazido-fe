import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../api/user";
import { logoutUser } from "../api/auth";
import useAuthStore from "../store/authStore";

function ProfilePage() {
  const navigate = useNavigate();
  const { logout, isAuthenticated, loading: authLoading } = useAuthStore();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log(error);
  console.log(setError);

  const [showToast, setShowToast] = useState(false);
  console.log(showToast);
  const [logoutError, setLogoutError] = useState(null);
  console.log(logoutError);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [version, setVersion] = useState("");

  useEffect(() => {
    fetch("/version.json")
      .then((res) => res.json())
      .then((data) => setVersion(data.version))
      .catch(() => setVersion("unknown"));
  }, []);

  // 컴포넌트 마운트 시 사용자 정보 로드
  useEffect(() => {
    // 인증 상태 확인 - 로딩이 끝나고 인증되지 않았다면 로그인 페이지로 리다이렉트
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const response = await getUserInfo();
        
        setUserInfo(response.data.data);
      } catch (err) {
        console.error("사용자 정보 로드 실패:", err);
        
        // 에러가 발생하면 무조건 로그인 페이지로 리다이렉트
        if (logout) logout(); // AuthContext의 logout 함수 호출
        navigate('/login');
        return;
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate, logout, isAuthenticated, authLoading]);

  // 상태가 업데이트된 후 실행되는 useEffect
useEffect(() => {
  if (userInfo) {
    console.log("업데이트된 userInfo:", userInfo);
  }
}, [userInfo]);

  const goToMap = () => {
    navigate("/map");
  };

  const goToChat = () => {
    navigate("/chat");
  };

  const goToPetInfo = () => {
    navigate("/pets");
  };

  const goToProfileEdit = () => {
    navigate("/profile/edit");
  };

  const goToPasswordChange = () => {
    navigate("/profile/password");
  };

  const handleLogout = async () => {
    ////console.log(...)

    try {
      ////console.log(...)
      const response = await logoutUser();
      console.log(response);

      // AuthContext의 로그아웃 함수 호출
      ////console.log(...)
      logout();

      // 토스트 메시지 표시
      ////console.log(...)
      setShowToast(true);

      // 리디렉션
      ////console.log(...)
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 처리 중 오류 발생:", error);
      console.error("오류 응답 데이터:", error.response?.data);
      setLogoutError("로그아웃 처리 중 오류가 발생했습니다.");
    }
  };

  // 로딩 중이면 로딩 표시
  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-amber-50">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-amber-800 border-t-transparent"></div>
        <p className="mt-4 text-amber-800 font-medium">
          사용자 정보를 불러오는 중...
        </p>
      </div>
    );
  }

  // 사용자 정보가 없으면 로그인 페이지로 리다이렉트
  if (!userInfo) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-amber-50">
      {/* 헤더 */}
      <header className="bg-white pt-2 pb-0 px-4 shadow-md flex items-center justify-center">
        <div className="flex items-center h-full gap-2">
          <img
            src="/gangazido-logo-header.png"
            alt="Gangazido Logo Header"
            className="h-14 w-28 object-cover self-center cursor-pointer"
            onClick={goToMap}
          />
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-4">
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mr-4 overflow-hidden">
              {userInfo?.profileImage && userInfo.profileImage !== "null" ? (
                <img
                  src={userInfo.profileImage}
                  alt="프로필 이미지"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // 이미지 로드 실패 시 기본 이미지로 대체
                    e.target.style.display = "none";
                    // SVG 아이콘 표시 (class 사용)
                    e.target.parentNode.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>   
                      `;
                  }}
                />
              ) : (
                // 기본 이미지로 하트 아이콘 사용
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-amber-800"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {userInfo?.nickname || "사용자"}
              </h2>
              <p className="text-gray-600">
                {userInfo?.email || ""}
              </p>
              <button
                onClick={goToProfileEdit}
                className="mt-2 text-sm text-amber-800 font-medium flex items-center"
              >
                프로필 수정
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* 계정 관리 */}
          <div>
            <h3 className="text-md font-semibold text-gray-700 mb-3">
              계정 관리
            </h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={goToPasswordChange}
                  className="w-full flex items-center justify-between p-3 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span className="text-gray-700">비밀번호 변경</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </li>
              {/* <li>
                <button className="w-full flex items-center justify-between p-3 rounded-md hover:bg-gray-50">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    <span className="text-gray-700">알림 설정</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </li> */}
              {/* <li>
                <button className="w-full flex items-center justify-between p-3 rounded-md hover:bg-gray-50">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-gray-700">고객센터</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </li> */}
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-3 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span className="text-gray-700">로그아웃</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 앱 정보 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-md font-semibold text-gray-700 mb-3">앱 정보</h3>
          <ul className="space-y-3">
            <li>
              <button className="w-full flex items-center justify-between p-3 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-gray-700">앱 버전</span>
                </div>
                <span className="text-gray-500">{version || "0.0.1"}</span>
              </button>
            </li>

            <li>
              <button
                className="w-full flex items-center justify-between p-3 rounded-md hover:bg-gray-50"
                onClick={() =>
                  window.open(
                    "https://github.com/orgs/100-hours-a-week/teams/jeju-2nd-5?query=",
                    "_blank"
                  )
                }
              >
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 496 512"
                    className="h-5 w-5 text-gray-500 mr-3"
                    fill="currentColor"
                  >
                    <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
                  </svg>
                  <span className="text-gray-700">개발자 정보</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </li>

            {/* <li>
              <button className="w-full flex items-center justify-between p-3 rounded-md hover:bg-gray-50">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span className="text-gray-700">개발자 정보</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </li> */}

            <li>
              <button
                className="w-full flex items-center justify-between p-3 rounded-md hover:bg-gray-50"
                onClick={() => setShowPrivacyModal(true)}
              >
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span className="text-gray-700">개인정보 처리방침</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </li>
            <li>
              <button
                className="w-full flex items-center justify-between p-3 rounded-md hover:bg-gray-50"
                onClick={() => setShowTermsModal(true)}
              >
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-gray-700">이용약관</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-between px-2">
          <button
            onClick={goToMap}
            className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">지도</span>
          </button>
          <button
            onClick={goToChat}
            className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">채팅</span>
          </button>
          <button className="flex flex-col items-center py-3 flex-1 text-amber-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">내 정보</span>
          </button>
          <button
            onClick={goToPetInfo}
            className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 21s-6-4.35-9-8c-3-3.35-3-7.35 0-10 3-3 7.5-2 9 2 1.5-4 6-5 9-2 3 3 3 7 0 10-3 3.65-9 8-9 8z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">반려견 정보</span>
          </button>
        </div>
      </nav>

      {/* 개인정보 처리방침 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-4/5 max-w-md overflow-y-auto max-h-[80vh]">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              📌 개인정보 처리방침
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                &apos;강아지 산책 도우미&apos;는 사용자들의 위치 기반 산책
                경험을 향상시키기 위해 다음과 같은 개인정보를 수집 및
                이용합니다.
              </p>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-1">
                  1. 수집하는 개인정보 항목
                </h4>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  <li>닉네임, 프로필 사진 (선택)</li>
                  <li>반려견 정보 (이름, 품종, 나이 등)</li>
                  <li>사용자의 위치 정보 (지도 마커 등록 시)</li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-1">
                  2. 개인정보의 이용 목적
                </h4>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  <li>마커 등록 및 공유 기능 제공</li>
                  <li>사용자 맞춤형 지도 정보 제공</li>
                  <li>서비스 개선 및 사용자 통계 분석</li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-1">
                  3. 보관 및 파기
                </h4>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  <li>개인정보는 회원 탈퇴 시 즉시 파기됩니다.</li>
                  <li>
                    단, 관련 법령에 따라 보존이 필요한 경우 일정 기간 동안
                    보관될 수 있습니다.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-1">
                  4. 제3자 제공
                </h4>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  <li>
                    본 서비스는 사용자의 동의 없이 개인정보를 외부에 제공하지
                    않습니다.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-1">
                  5. 사용자 권리
                </h4>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  <li>
                    개인정보 조회, 수정, 삭제 요청은 [설정 {">"} 내정보] 메뉴를
                    통해 가능하며, 언제든지 탈퇴하실 수 있습니다.
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-800 rounded-md hover:bg-amber-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이용약관 모달 */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-4/5 max-w-md overflow-y-auto max-h-[80vh]">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              📌 이용약관
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                본 서비스는 사용자들이 반려견과의 산책을 더욱 안전하고 즐겁게
                만들 수 있도록,
                <br />
                직접 마커를 통해 장소를 기록하고 공유할 수 있는 위치 기반
                서비스입니다.
              </p>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-1">
                  1. 서비스 목적
                </h4>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  <li>반려견 산책 장소 추천, 위험요소 정보 공유</li>
                  <li>커뮤니티 기반 마킹 지도 운영</li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-1">
                  2. 이용자 의무
                </h4>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  <li>허위 정보나 불쾌감을 유발하는 콘텐츠 등록 금지</li>
                  <li>서비스 이용 시 타인의 권리를 침해하지 않을 것</li>
                  <li>마커 등록 시 정확하고 책임 있는 정보 공유</li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-1">
                  3. 위치 정보 이용
                </h4>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  <li>
                    본 서비스는 위치 기반 기능을 포함하며, 마커 등록 시 현재
                    위치를 사용할 수 있습니다.
                  </li>
                  <li>
                    위치 정보는 서버에 저장되지 않으며, 사용자의 마커 생성
                    시에만 사용됩니다.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-1">
                  4. 서비스 제한 및 종료
                </h4>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  <li>
                    운영자는 부적절한 마커 또는 활동에 대해 사전 경고 없이
                    삭제하거나 이용을 제한할 수 있습니다.
                  </li>
                  <li>서비스는 사전 공지 후 변경되거나 중단될 수 있습니다.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-1">
                  5. 기타
                </h4>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  <li>
                    본 약관에 동의함으로써 사용자는 서비스의 모든 정책에 따를
                    것을 인정합니다.
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-800 rounded-md hover:bg-amber-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
