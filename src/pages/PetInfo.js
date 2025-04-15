import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPetInfo } from "../api/pet";
import { useAtomValue, useSetAtom } from 'jotai';
import { isAuthenticatedAtom, loadingAtom, logoutAtom } from '../atoms/authAtoms';

function PetInfo() {
  const navigate = useNavigate();
  
  // jotai atoms 사용
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const authLoading = useAtomValue(loadingAtom);
  const logout = useSetAtom(logoutAtom);
  
  console.log(isAuthenticated);
  console.log(authLoading);


  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const goToMap = () => navigate("/map");
  const goToChat = () => navigate("/chat");
  const goToProfile = () => navigate("/profile");
  const goToPetEdit = () => navigate("/pets/edit");

  // 반려견 기본 정보 가져오기
  useEffect(() => {
    const fetchPetInfo = async () => {
      try {
        // 인증 상태가 아니면 바로 로그인 페이지로 리다이렉트
        if (!isAuthenticated && !authLoading) {
          navigate('/login');
          return;
        }
        
        const response = await getPetInfo();
        const data = response.data.data;
        setPet(data);
        setLoading(false);
      } catch (error) {
        console.error("반려견 정보 가져오기 실패:", error);
        
        // 인증 오류(401) 처리 - 단순히 로그인 페이지로 리다이렉트
        if (error.response && error.response.status === 401) {
          logout(); // jotai logout atom 호출
          navigate('/login');
          return;
        }
        
        const message = error?.response?.data?.message;
        if (message === "not_found_pet") {
          navigate("/pets/register");
        } else {
          setError("반려견 정보를 불러오는 중 문제가 발생했습니다.");
          setLoading(false);
        }
      }
    };

    fetchPetInfo();
  }, [navigate, isAuthenticated, authLoading, logout]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-amber-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md mb-4 w-full max-w-md">
          <p className="font-medium">{error}</p>
        </div>
        <button
          onClick={() => navigate('/map')}
          className="px-6 py-3 bg-amber-800 text-white rounded-full shadow-md hover:bg-amber-700 transition-all duration-300 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          지도로 돌아가기
        </button>
      </div>
    );
  }

  // 로딩 중이면 로딩 표시
  if (loading || !pet) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-amber-50">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-amber-800 border-t-transparent"></div>
        <p className="mt-4 text-amber-800 font-medium">반려견 정보를 불러오는 중...</p>
      </div>
    );
  }

  // 반려견 나이 계산 (1살 미만은 개월 수로 표시)
  const formatAge = (age) => {
    if (age < 1) {
      return `${Math.round(age * 12)}개월`;
    }
    return `${age}살`;
  };

  return (
    <div className="flex flex-col h-full bg-amber-50">
      {/* 헤더 */}
      <header className="bg-white pt-2 pb-0 px-4 shadow-md flex items-center relative">
        <button onClick={() => navigate('/map')} className="absolute left-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* 반려견 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-5">
          {/* 반려견 헤더 배경 */}
          <div className="h-24 bg-white relative">
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
              <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-md">
                <div className="w-full h-full bg-amber-100 rounded-full overflow-hidden flex items-center justify-center">
                  {pet.profileImage ? (
                    <img
                      src={pet.profileImage}
                      alt="반려견 프로필"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        setPet((prev) => ({ ...prev, profileImage: null }));
                      }}
                    />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 text-amber-800"
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
              </div>
            </div>
          </div>

          {/* 반려견 이름 및 태그 */}
          <div className="pt-20 pb-6 px-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{pet.name}</h2>
            <p className="text-sm text-gray-500 mb-3">{pet.breed || '믹스견'} · {pet.gender ? "수컷" : "암컷"}</p>

            <div className="flex justify-center space-x-2 mb-2">
              {pet.neutered && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  중성화 완료
                </span>
              )}
              {pet.vaccinated && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  예방접종 완료
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 반려견 기본 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
          <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            기본 정보
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* 나이 */}
            <div className="bg-amber-50 rounded-xl p-4 flex flex-col items-center">
              <span className="text-xs text-amber-600 font-medium mb-1">나이</span>
              <span className="text-xl font-bold text-gray-800">{formatAge(pet.age)}</span>
            </div>

            {/* 몸무게 */}
            <div className="bg-amber-50 rounded-xl p-4 flex flex-col items-center">
              <span className="text-xs text-amber-600 font-medium mb-1">몸무게</span>
              <span className="text-xl font-bold text-gray-800">{pet.weight} kg</span>
            </div>
          </div>

          <button
            onClick={goToPetEdit}
            className="w-full border border-amber-800 text-amber-800 bg-transparent hover:bg-amber-50 p-3.5 rounded-xl text-center font-medium mt-6 transition-all duration-300 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            반려견 정보 수정
          </button>
        </div>

        {/* 반려견 케어 정보 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-5">
          <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            케어 팁
          </h3>

          <div className="bg-amber-50 rounded-xl p-4 mb-2">
            <h4 className="font-medium text-amber-800 mb-2">권장 사료량</h4>
            <p className="text-sm text-gray-700">
              {(() => {
                if (pet.age < 1) {
                  return "1세 미만의 강아지는 성장기에 맞는 전용 사료를 급여해야 하며, 하루 3~4회 나눠 급여하는 것이 좋습니다.";
                }
                if (pet.weight < 5) {
                  return "몸무게가 작은 반려견에게는 하루 약 120-180g의 사료를 2~3회 나눠 급여하는 것이 좋습니다.";
                } else if (pet.weight < 15) {
                  return "중소형견은 하루 약 180~320g의 사료를 2회 나눠 급여하는 것이 좋습니다.";
                } else {
                  return "대형견은 하루 약 320~480g 이상의 사료를 2회 나눠 급여하는 것이 좋습니다.";
                }
              })()}
            </p>
          </div>

          <div className="bg-amber-50 rounded-xl p-4">
            <h4 className="font-medium text-amber-800 mb-2">적정 산책 시간</h4>
            <p className="text-sm text-gray-700">
              {(() => {
                const retrieverBreeds = ['골든 리트리버', '래브라도 리트리버'];
                const smallBreeds = ['푸들', '비숑 프리제', '포메라니안', '말티즈'];
                const mediumBreeds = ['웰시코기', '믹스견', '진돗개'];
                const largeBreeds = ['보더 콜리', '시베리안 허스키'];

                if (pet.age < 1) {
                  return "1세 미만 강아지는 무리한 산책보다 짧은 놀이 중심의 활동이 적절합니다.";
                }
                if (retrieverBreeds.includes(pet.breed) || largeBreeds.includes(pet.breed)) {
                  return "활동량이 많은 견종으로 하루 1~2시간 정도의 산책을 권장합니다.";
                } else if (smallBreeds.includes(pet.breed)) {
                  return "소형견은 하루 30분~1시간 정도의 산책이 적당합니다.";
                } else if (mediumBreeds.includes(pet.breed)) {
                  return "중형견은 하루 약 1시간 정도의 산책이 적당합니다.";
                } else {
                  return "견종에 따라 차이가 있을 수 있으니, 반려견의 성격과 건강 상태에 맞춰 산책량을 조절하세요.";
                }
              })()}
            </p>
          </div>
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
          <button
            onClick={goToProfile}
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">내 정보</span>
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
                d="M12 21s-6-4.35-9-8c-3-3.35-3-7.35 0-10 3-3 7.5-2 9 2 1.5-4 6-5 9-2 3 3 3 7 0 10-3 3.65-9 8-9 8z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">반려견 정보</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default PetInfo;