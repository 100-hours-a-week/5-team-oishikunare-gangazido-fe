import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadPetImage, registerPet } from '../api/pet';

function PetRegister() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const [nameError, setNameError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [breedError, setBreedError] = useState('');
  const [touched, setTouched] = useState({
    name: false,
    breed: false,
    age: false,
    gender: false,
    weight: false,
  });

  const breedOptions = [
    '푸들',
    '비숑 프리제',
    '포메라니안',
    '말티즈',
    '웰시코기',
    '골든 리트리버',
    '래브라도 리트리버',
    '보더 콜리',
    '시베리안 허스키',
    '진돗개',
    '믹스견',
    '기타',
  ];

  const cloudFrontUrl = window._env_.REACT_APP_CLOUDFRONT_URL;

  const goToMap = () => navigate('/map');
  const goToChat = () => navigate('/chat');
  const goToProfile = () => navigate('/profile');
  const goToPetInfo = () => navigate('/pets');

  const handleRegister = async () => {
    const isValid = validateFields();
    if (!isValid) return;
  
    try {
      let profileImageKey = null;

      // ✅ 이미지 파일이 있다면 먼저 업로드 후 key 확보
      if (profileImage instanceof File) {
        profileImageKey = await uploadPetImage(profileImage);
        const imageUrl = `${cloudFrontUrl}/${profileImageKey}?t=${Date.now()}`;
        setProfileImagePreview(imageUrl);
        ////console.log(...)
      }

      const petData = {
        name,
        age: parseInt(age),
        gender: gender === 'male',
        breed,
        weight: parseFloat(weight),
        profileImage: profileImageKey,
      };

      ////console.log(...)
      await registerPet(petData);

      setShowToast(true);
      setTimeout(() => {
        window.location.href = "/pets";
      }, 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message;
      handleRegisterError(errorMsg);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      // ✅ 사용자가 실제로 파일을 선택한 경우
      setProfileImage(file);
      const tempUrl = URL.createObjectURL(file);
      setProfileImagePreview(tempUrl);
      ////console.log(...)
    } else {
      // ✅ 사용자가 '파일 선택' 창에서 취소를 누른 경우
      setProfileImage(null); // S3 업로드 대상 제거
      setProfileImagePreview(null); // 미리보기 초기화
    }
  };

  // 프론트 자체 유효성 검사
  const validateFields = () => {
    let isValid = true;
  
    setNameError('');
    setAgeError('');
    setWeightError('');
    setGenderError('');
    setBreedError('');
  
    // 이름
    const nameRegex = /^[가-힣a-zA-Z]+$/;
    if (!name) {
      setNameError('반려견의 이름을 입력하세요.');
      isValid = false;
    } else if (!nameRegex.test(name)) {
      setNameError('반려견의 이름은 공백없이 한글 또는 영문만 입력 가능합니다.');
      isValid = false;
    } else if (name.length > 10) {
      setNameError('반려견의 이름은 최대 10자까지 입력 가능합니다.');
      isValid = false;
    }
  
    // 나이
    const ageNum = parseInt(age);
    if (!age) {
      setAgeError('반려견의 나이를 입력하세요.');
      isValid = false;
    } else if (isNaN(ageNum)) {
      setAgeError('반려견 나이는 1부터 50사이의 숫자만 입력 가능합니다.');
      isValid = false;
    } else if (ageNum < 1) {
      setAgeError('반려견 나이는 1부터 50사이의 숫자만 입력 가능합니다.');
      isValid = false;
    } else if (ageNum >= 51) {
      setAgeError('반려견 나이는 1부터 50사이의 숫자만 입력 가능합니다.');
      isValid = false;
    }
  
    // 몸무게
    const trimmed = String(weight).trim();
    const weightNum = parseFloat(trimmed);

    if (trimmed === '') {
      setWeightError('반려견의 몸무게를 입력해주세요.');
      isValid = false;
    } else if (isNaN(weightNum)) {
      setWeightError('올바른 몸무게 형식을 입력해주세요. (예: 5 또는 5.2)');
      isValid = false;
    } else if (weightNum <= 0) {
      setWeightError('반려견 몸무게는 1부터 200사이의 숫자만 입력 가능합니다.');
      isValid = false;
    } else if (weightNum >= 200) {
      setWeightError('반려견 몸무게는 1부터 200사이의 숫자만 입력 가능합니다.');
      isValid = false;
    } else {
      setWeightError('');
    }
  
    // 성별
    if (!gender) {
      setGenderError('반려견의 성별을 선택하세요.');
      isValid = false;
    }
  
    // 품종
    if (!breed) {
      setBreedError('반려견의 품종을 입력하세요.');
      isValid = false;
    }
  
    return isValid;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateFields(field); // 💡 이렇게 분리해서 바로 호출
  };

  // 백엔드 응답 처리
  const handleRegisterError = (message) => {
    setNameError('');
    setAgeError('');
    setWeightError('');
    setGenderError('');
    setBreedError('');
  
    switch (message) {
      case 'required_pet_name':
        setNameError('반려견의 이름을 입력해주세요.');
        break;
      case 'invalid_pet_name_format':
        setNameError('반려견의 이름은 공백없이 한글 또는 영문만 입력 가능합니다.');
        break;
      case 'invalid_pet_name_length':
        setNameError('반려견의 이름은 최대 10자까지 입력 가능합니다.');
        break;
  
      case 'required_pet_age':
        setAgeError('반려견의 나이를 입력해주세요.');
        break;
      case 'invalid_pet_age_format':
        setAgeError('반려견의 나이는 숫자로 입력해주세요.');
        break;
      case 'invalid_pet_age_value':
        setAgeError('반려견 나이는 1부터 50사이의 숫자만 입력 가능합니다.');
        break;
  
      case 'required_pet_weight':
        setWeightError('반려견의 몸무게를 입력해주세요.');
        break;
      case 'invalid_pet_weight':
        setWeightError('올바른 몸무게 형식을 입력해주세요. (예: 5 또는 5.2)');
        break;
  
      case 'required_pet_gender':
        setGenderError('반려견의 성별을 선택해주세요.');
        break;
  
      case 'required_pet_breed':
        setBreedError('반려견의 품종을 입력해주세요.');
        break;
  
      case 'already_exits_pet':
        setNameError('이미 등록된 반려견이 있어요.');
        break;
  
      case 'required_authorization':
        alert('로그인이 필요합니다.');
        navigate('/login');
        break;

      case 'required_permission': 
        alert('해당 반려견에 대한 수정 권한이 없습니다.');
        break;
  
      case 'not_found_user':
        alert('사용자를 찾을 수 없습니다.');
        break;

      case 'internal_server_error':
        alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        break;
  
      default:
        alert('알 수 없는 오류가 발생했습니다.');
    }
  };

  // 토스트 메시지가 표시되면 3초 후에 자동으로 사라지도록 설정
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white pt-2 pb-0 px-4 shadow-md flex items-center relative">
        <button onClick={() => navigate('/profile')} className="absolute left-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-grow flex justify-center">
          <img
            src="/gangazido-logo-header.png"
            alt="Gangazido Logo Header"
            className="h-14 w-28 object-cover cursor-pointer"
            onClick={() => navigate('/map')}
          />
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-3 overflow-hidden">
              {profileImagePreview ? (
                <img 
                  src={profileImagePreview}
                  alt="미리보기"
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.warn("🐛 이미지 로딩 실패! fallback 아이콘 표시");
                    setProfileImagePreview(null); // fallback svg로 대체되게
                  }}
                />
              ) : (
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
            <label htmlFor="pet-profile-upload" className="text-sm text-amber-800 font-medium cursor-pointer">
              프로필 사진 추가
              <input
                id="pet-profile-upload"
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">반려견 이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="이름"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
              />
              {touched.name && nameError && (
                <p className="text-sm text-red-500 mt-1">{nameError}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">품종</label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                onBlur={() => handleBlur('breed')}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
              >
                <option value="">선택하세요</option>
                {breedOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {touched.breed && breedError && (
                <p className="text-sm text-red-500 mt-1">{breedError}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
              <input
                type="number"
                value={age}
                onChange={(e) => {
                  const value = e.target.value;
              
                  // 정수만 입력 허용 + 2자리까지만
                  if (/^\d{0,2}$/.test(value)) {
                    setAge(value);
                  }
                }}
                onBlur={() => handleBlur('age')}
                placeholder="나이"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
                min="1"
              />
              {touched.age && ageError && (
                <p className="text-sm text-red-500 mt-1">{ageError}</p>
              )}
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">몸무게</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => {
                  const value = e.target.value;
                
                  // 정수 1~3자리 + 선택적으로 소숫점 1자리까지 허용
                  if (/^\d{0,3}(\.\d{0,1})?$/.test(value)) {
                    setWeight(value);
                  }
                }}
                onBlur={() => handleBlur('weight')}
                placeholder="kg 단위로 입력해주세요"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
                step="0.1"
                min="0.1"
              />
              {touched.weight && weightError && (
                <p className="text-sm text-red-500 mt-1">{weightError}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                onBlur={() => handleBlur('gender')}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                required
              >
                <option value="">선택하세요</option>
                <option value="male">수컷</option>
                <option value="female">암컷</option>
              </select>
              {touched.gender && genderError && (
                <p className="text-sm text-red-500 mt-1">{genderError}</p>
              )}
            </div>

            <button 
              onClick={handleRegister}
              className="w-full bg-amber-800 text-white p-3 rounded-md text-center font-medium mt-4"
            >
              등록하기
            </button>
          </div>
        </div>
      </div>

      {/* 토스트 메시지 */}
      {showToast && (
        <div className="fixed bottom-24 left-0 right-0 mx-auto w-3/5 max-w-xs bg-white bg-opacity-80 border border-amber-800 text-amber-800 p-3 rounded-md shadow-lg text-center z-50 animate-fade-in-up">
          등록을 완료하였습니다.
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-between px-2">
          <button onClick={goToMap} className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1 font-medium">지도</span>
          </button>
          <button onClick={goToChat} className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="text-xs mt-1 font-medium">채팅</span>
          </button>
          <button onClick={goToProfile} className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1 font-medium">내 정보</span>
          </button>
          <button onClick={goToPetInfo} className="flex flex-col items-center py-3 flex-1 text-amber-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s-6-4.35-9-8c-3-3.35-3-7.35 0-10 3-3 7.5-2 9 2 1.5-4 6-5 9-2 3 3 3 7 0 10-3 3.65-9 8-9 8z" />
            </svg>
            <span className="text-xs mt-1 font-medium">반려견 정보</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default PetRegister; 