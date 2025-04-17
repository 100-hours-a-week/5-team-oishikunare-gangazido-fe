import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMapMarkers, registerMarker, deleteMarker } from "../api/map"; // axios 인스턴스로 정의된 API 제리 추가
import useAuthStore from "../store/authStore"; // 기존 getUserInfo 대신 useAuth 훅 사용
import { ToastContainer, toast } from "react-toastify"; // 토스트 메시지
import "react-toastify/dist/ReactToastify.css";
import { getNicknameByUserId } from "../api/user"; // 유저 닉네임 가져오기
import { getPetInfoByUserId } from "../api/pet"; // 강아지 정보 가져오기

function MapPage() {
  const currentFilterTypeRef = useRef("all"); // 마커 필터 타입 저장
  const navigate = useNavigate();
  const mapContainer = useRef(null);  // 지도 DOM 참조
  const [map, setMap] = useState(null); // 카카오맵 객체
  const [markers, setMarkers] = useState([]); // 마커 목록 상태
  const markersRef = useRef([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);  // 맵 로딩 완료 여부
  const [isCenterMode, setIsCenterMode] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(3);
  // eslint-disable-next-line no-unused-vars
  const [visibleMarkers, setVisibleMarkers] = useState([]);
  const mapBoundsRef = useRef(null);
  const clusterRef = useRef(null);  // 클러스터 객체
  // 첫 페이지 모달
  const [showGuideModal, setShowGuideModal] = useState(true); // 실제로 보일지 여부
  // 현재 위치 상태
  const currentLocationMarkerRef = useRef(null);
  // 사용자 인증 상태
  const { isAuthenticated, user } = useAuthStore(); // AuthContext에서 인증 상태 가져오기
  const userRef = useRef(null); // user 최신 값 유지용

  // 첫 페이지 모달 창
  useEffect(() => {
    const hideGuide = localStorage.getItem("hideGuideModal");
    if (hideGuide === "true") {
      setShowGuideModal(false); // 다시 보지 않기 눌렀다면 false로
    } else {
      setShowGuideModal(true); // 👉 아니면 보여줌
    }
  }, []);

  // user를 useRef에 저장함으로써 최신 값 참조하도록
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 마커 모달 창 지도 클릭 시 닫기 일단 보류
  // useEffect(() => {
  //   if (!map || !window.kakao || !window.kakao.maps) return;

  //   const handleMapClick = () => {
  //     // 모든 오버레이 닫기
  //     markersRef.current.forEach((m) => {
  //       if (m.overlay) {
  //         try {
  //           m.overlay.setMap(null);
  //           m.overlay = null;
  //         } catch (e) {
  //           console.warn("지도 클릭 시 overlay 닫기 실패:", e);
  //         }
  //       }
  //     });
  //   };

  //   // 지도에 클릭 이벤트 등록
  //   const mapClickListener = window.kakao.maps.event.addListener(
  //     map,
  //     "click",
  //     handleMapClick
  //   );

  //   // 클린업 함수에서 이벤트 제거
  //   return () => {
  //     if (mapClickListener) {
  //       window.kakao.maps.event.removeListener(map, "click", handleMapClick);
  //     }
  //   };
  // }, [map]);

  // 모달 관련 상태 수정
  const [showModal, setShowModal] = useState(false);
  const [tempMarkerType, setTempMarkerType] = useState("댕플");
  const [tempMarkerSubType, setTempMarkerSubType] = useState(null);

  // 카카오맵 API 스크립트 로딩 상태
  const [kakaoMapLoaded, setKakaoMapLoaded] = useState(false);

  // 마커 필터링 타입 저장 상태 추가
  // eslint-disable-next-line no-unused-vars
  const [filterType, setFilterType] = useState("all");

  // 순환 참조를 막기 위한 removeMarker 함수 ref
  const removeMarkerRef = useRef(null);

  // 기본값 좌표
  const [centerPosition, setCenterPosition] = useState({
    lat: 33.48717138746649, // 제주도 구름스퀘어 위도
    lng: 126.53171329989748, // 제주도 구름스퀘어 경도
  });

  // 페이지 진입 시 지도 초기화 후 내 위치로 이동
  useEffect(() => {
    if (map) {
      moveToCurrentLocation();
    }
  }, [map]);


  // 화면 크기 변화 대응: Kakao Map relayout + vh 단위 계산
  useEffect(() => {
    const handleResize = () => {
      // Kakao Map relayout
      if (map) {
        map.relayout();
      }

      // vh 단위 갱신 (iOS 대응)
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // 초기에도 한 번 실행
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  // 현재 위치 마커 렌더 함수
  const showCurrentLocationMarker = (latitude, longitude) => {
    const location = new window.kakao.maps.LatLng(latitude, longitude);
  
    // 이전 마커가 있다면 제거
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null);
      currentLocationMarkerRef.current = null;
    }
  
    // 이미지 설정 (파란색 핀 모양)
    const imageSrc = "/images/geolocation.gif";
    const imageSize = new window.kakao.maps.Size(50, 50); 
    const imageOption = { offset: new window.kakao.maps.Point(15, 15) };
    const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);
  
    const marker = new window.kakao.maps.Marker({
      position: location,
      image: markerImage,
      zIndex: 9999,
    });
  
    marker.setMap(map);
    currentLocationMarkerRef.current = marker;
  };


  // 카카오맵 API 스크립트 동적 로드 함수
  const loadKakaoMapScript = useCallback(() => {
    // 이미 로드된 경우 중복 로드 방지
    if (window.kakao && window.kakao.maps) {
      setKakaoMapLoaded(true);
      return;
    }

    // API 키 가져오기
    const apiKey =
      process.env.NODE_ENV === "development"
        ? process.env.REACT_APP_KAKAO_MAP_API_KEY
        : window._env_?.KAKAO_MAP_API_KEY;

    if (!apiKey) {
      console.error("카카오맵 API 키가 환경 변수에 설정되지 않았습니다.");
      return;
    }

    // 스크립트 태그 생성
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;

    // 스크립트 로드 완료 시 처리
    script.onload = () => {
      // autoload=false 옵션을 사용했으므로 수동으로 로드 실행
      window.kakao.maps.load(() => {
        ////console.log(...)
        setKakaoMapLoaded(true);
      });
    };

    // 스크립트 로드 실패 시 처리
    script.onerror = () => {
      console.error("카카오맵 API 로드 실패");
      setKakaoMapLoaded(false);
    };

    // 스크립트 추가
    document.head.appendChild(script);
  }, []);

  // 컴포넌트 마운트 시 카카오맵 API 스크립트 로드
  useEffect(() => {
    loadKakaoMapScript();
  }, [loadKakaoMapScript]);

  // 마커 종류
  const markerImages = useRef([
    {
      type: "댕플",
      image: null,
      imageSize: null,
      imageOption: null,
    },
    {
      type: "댕져러스",
      image: null,
      imageSize: null,
      imageOption: null,
      subTypes: ["들개", "빙판길", "염화칼슘", "공사중"],
    },
  ]);

  // 마커 타입 코드 상수
  const MARKER_TYPES = {
    댕플: 0,
    댕져러스: { DEFAULT: 1, 들개: 1, 빙판길: 2, 염화칼슘: 3, 공사중: 4 },
  };

  // 마커 이미지 URL 상수
  const MARKER_IMAGES = {
    댕플: "/images/dangple_square.png",
    댕져러스: {
      DEFAULT: "https://cdn-icons-png.flaticon.com/512/4636/4636076.png",
      들개: "/images/dog.png",
      빙판길: "/images/icy.png",
      염화칼슘: "/images/foot.png",
      공사중: "/images/construction.png",
    },
    // 이모티콘 URL 추가
    EMOJI: {
      들개: "🐕",
      빙판길: "🧊",
      염화칼슘: "🧂",
      공사중: "🚧",
    },
  };

  // 마커 타입 코드 가져오기
  const getMarkerTypeCode = (type, subType = null) => {
    if (type === "댕플") return MARKER_TYPES.댕플;
    if (type === "댕져러스") {
      return subType
        ? MARKER_TYPES.댕져러스[subType]
        : MARKER_TYPES.댕져러스.DEFAULT;
    }
    return 0; // 기본값
  };

  // markers 상태가 변경될 때마다 ref 업데이트
  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  // 마커 이미지 설정 함수
  const initMarkerImages = useCallback(() => {
    if (!window.kakao || !window.kakao.maps) {
      ////console.log(...)
      return;
    }

    try {
      const size = new window.kakao.maps.Size(25, 25);
      const option = { offset: new window.kakao.maps.Point(12.5, 12.5) };

      // 1. 댕플 마커
      markerImages.current[0].image = new window.kakao.maps.MarkerImage(
        MARKER_IMAGES.댕플,
        size,
        option
      );

      // 2. 댕져러스 마커 객체 준비
      if (!markerImages.current[1]) {
        markerImages.current[1] = {
          type: "댕져러스",
          subTypes: ["들개", "빙판길", "염화칼슘", "공사중"],
        };
      }

      const subTypes = ["들개", "빙판길", "염화칼슘", "공사중"];

      // 3. 각 서브타입별 PNG 이미지로 마커 생성
      subTypes.forEach((subType) => {
        const imageSrc =
          MARKER_IMAGES.댕져러스[subType] || MARKER_IMAGES.댕져러스.DEFAULT;

        markerImages.current[1][subType] = new window.kakao.maps.MarkerImage(
          imageSrc,
          size,
          option
        );
      });

      // 4. 댕져러스 DEFAULT 마커도 생성
      const defaultImageSrc = MARKER_IMAGES.댕져러스.DEFAULT;
      markerImages.current[1].image = new window.kakao.maps.MarkerImage(
        defaultImageSrc,
        size,
        option
      );

      //console.log(...)
    } catch (error) {
      console.error("마커 이미지 초기화 중 오류 발생:", error);
    }
  }, []);

  // addMarker 함수의 ref 추가
  const addMarkerRef = useRef(null);

  // 클러스터 스타일 정의
  const CLUSTER_STYLES = {
    mine: {
      background: "rgba(209, 250, 229, 0.85)", // #d1fae5 + 투명도
      text: "#065f46",
      border: "#34d399",
      shadow: "0 4px 12px rgba(16,185,129,0.15)",
    },
    댕플: {
      background: "rgba(254, 249, 195, 0.85)", // #fef9c3
      text: "#92400e",
      border: "#fde68a",
      shadow: "0 4px 12px rgba(253,224,71,0.2)",
    },
    댕져러스: {
      background: "rgba(254, 226, 226, 0.85)", // #fee2e2
      text: "#991b1b",
      border: "#fca5a5",
      shadow: "0 4px 12px rgba(248,113,113,0.2)",
    },
    all: {
      background: "rgba(229, 231, 235, 0.85)", // #e5e7eb
      text: "#374151",
      border: "#d1d5db",
      shadow: "0 4px 12px rgba(156,163,175,0.15)",
    },
  };

  // 필터 타입에 따라 클러스터러 생성 함수
  const createClustererWithStyle = (mapInstance, styleKey = "all") => {
    const style = CLUSTER_STYLES[styleKey] || CLUSTER_STYLES.all;

    return new window.kakao.maps.MarkerClusterer({
      map: mapInstance,
      averageCenter: true,
      minLevel: 5,
      disableClickZoom: false,
      calculator: [10, 30, 50, 100],
      texts: (count) => `<span>${count}</span>`, 
      styles: [
        {
          width: "45px",
          height: "45px",
          background: style.background,
          color: style.text,
          textAlign: "center",
          lineHeight: "50px",
          borderRadius: "50%",
          fontSize: "15px",
          fontWeight: "bold",
          border: `2px solid ${style.border}`,
          boxShadow: style.shadow,
  

          // 모바일 클러스터링 위함
          position: "absolute",
          transform: "translate(-50%, -50%)", // 중심 기준 위치 이동
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          whiteSpace: "nowrap", // 모바일에서 이상하면 뺄 것 
        },
      ],
    });
  };
  // 지도 초기화
  useEffect(() => {
    // 카카오맵 API가 로드되지 않았으면 초기화하지 않음
    if (!kakaoMapLoaded) {
      return;
    }

    // 카카오맵 초기화 함수
    const initializeMap = () => {
      try {
        // 맵 컨테이너 확인
        if (!mapContainer.current) {
          return;
        }

        // 카카오맵 객체 확인
        if (!window.kakao || !window.kakao.maps) {
          setTimeout(initializeMap, 200); // 200ms 후 재시도
          return;
        }

        // 이미 맵이 초기화된 경우 중복 초기화 방지
        if (map) return;

        // 지도 옵션 설정
        const options = {
          center: new window.kakao.maps.LatLng(
            centerPosition.lat,
            centerPosition.lng
          ),
          level: currentZoomLevel,
        };

        // 지도 생성
        const kakaoMapInstance = new window.kakao.maps.Map(
          mapContainer.current,
          options
        );

        // 상태 업데이트
        setMap(kakaoMapInstance);
        setIsMapLoaded(true);

        // 마커 클러스터러 초기화
        try {
          if (window.kakao.maps.MarkerClusterer) {
            const clusterer = new window.kakao.maps.MarkerClusterer({
              map: kakaoMapInstance,
              averageCenter: true,
              minLevel: 5,
              disableClickZoom: false,
              styles: [
                {
                  width: "50px",
                  height: "50px",
                  background: "rgba(255, 165, 0, 0.7)",
                  color: "#fff",
                  textAlign: "center",
                  lineHeight: "50px",
                  borderRadius: "25px",
                  fontSize: "14px",
                  fontWeight: "bold",
                },
              ],
            });
            clusterRef.current = clusterer;
          }
        } catch (error) {
          console.error("마커 클러스터러 초기화 오류");
        }

        // 마커 이미지 초기화
        initMarkerImages();

        const dragendListener = window.kakao.maps.event.addListener(
          kakaoMapInstance,
          "dragend",
          () => {
            if (!kakaoMapInstance) return;

            // 드래그 시 모든 오버레이 닫기
            markersRef.current.forEach((m) => {
              if (m.overlay) {
                try {
                  m.overlay.setMap(null);
                  m.overlay = null;
                } catch (e) {
                  console.warn("드래그 시 overlay 닫기 실패:", e);
                }
              }
            });

            const center = kakaoMapInstance.getCenter();
            const level = kakaoMapInstance.getLevel();

            // 상태 업데이트
            setCurrentZoomLevel(level);
            setCenterPosition({
              lat: center.getLat(),
              lng: center.getLng(),
            });

            kakaoMapInstance.relayout();

            // ✅ 바다 벗어났는지 확인할 범위
            const bounds = new window.kakao.maps.LatLngBounds(
              new window.kakao.maps.LatLng(30.0, 122.0),
              new window.kakao.maps.LatLng(40.5, 136.5)
            );

            const fallbackPosition = new window.kakao.maps.LatLng(33.487171, 126.531713); // 구름스퀘어

            if (!bounds.contain(center)) {
              toast.warn("지도를 벗어났어요! 현재 위치로 이동합니다", {
                position: "bottom-center",
                autoClose: 2500,
                style: {
                  background: "#fff7ed",
                  color: "#b45309",
                  border: "1px solid #fcd34d",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  maxWidth: "none",
                  width: "fit-content",
                  padding: "12px 16px",
                  fontSize: "14px",
                },
                icon: "🌊",
              });

              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const currentPos = new window.kakao.maps.LatLng(latitude, longitude);
                    kakaoMapInstance.setCenter(currentPos);
                    if (kakaoMapInstance.getLevel() > 5) {
                      kakaoMapInstance.setLevel(4);
                    }
                  },
                  (error) => {
                    kakaoMapInstance.setCenter(fallbackPosition);
                    if (kakaoMapInstance.getLevel() > 5) {
                      kakaoMapInstance.setLevel(4);
                    }
                  },
                  {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                  }
                );
              } else {
                kakaoMapInstance.setCenter(fallbackPosition);
                if (kakaoMapInstance.getLevel() > 5) {
                  kakaoMapInstance.setLevel(4);
                }
              }

              return;
            }

            // 보이는 마커 업데이트는 그 이후에 진행
            updateVisibleMarkers(kakaoMapInstance);
          }
        );

        // 줌 변경 이벤트 등록 - 줌 레벨 업데이트만 담당
        const zoomChangedListener = window.kakao.maps.event.addListener(
          kakaoMapInstance,
          "zoom_changed",
          () => {
            if (!kakaoMapInstance) return;

            // 줌 레벨 업데이트
            const level = kakaoMapInstance.getLevel();
            setCurrentZoomLevel(level);

            // 보이는 영역 업데이트
            updateVisibleMarkers(kakaoMapInstance);
          }
        );

        // 보이는 마커 업데이트 함수 (지도 드래그, 줌 이벤트 후 호출되는 함수)
        const updateVisibleMarkers = (mapInstance) => {
          if (!mapInstance) return;

          const bounds = mapInstance.getBounds();
          mapBoundsRef.current = bounds;

          const currentMarkers = markersRef.current;
          const filterType = currentFilterTypeRef.current;

          if (currentMarkers && currentMarkers.length > 0) {
            const visibleMarkersFiltered = currentMarkers.filter(
              (markerInfo) => {
                if (!markerInfo.marker) return false;

                const inBounds = bounds.contain(
                  markerInfo.marker.getPosition()
                );

                // 내 마커 필터 조건 추가
                const isMine =
                  isAuthenticated &&
                  markerInfo.user_id === userRef.current?.userId;

                const matchesFilter =
                  filterType === "all"
                    ? true
                    : filterType === "mine"
                      ? isMine
                      : markerInfo.type === filterType;

                // 👉 필터와 영역 조건 모두 만족하는 경우만 지도에 표시
                if (inBounds && matchesFilter) {
                  markerInfo.marker.setMap(mapInstance);
                  return true;
                } else {
                  markerInfo.marker.setMap(null); // 조건 안 맞으면 숨기기
                  return false;
                }
              }
            );

            // 상태 업데이트
            setVisibleMarkers(visibleMarkersFiltered);

            // 클러스터러 업데이트
            if (clusterRef.current) {
              clusterRef.current.clear();

              const kakaoMarkers = visibleMarkersFiltered.map((m) => m.marker);
              if (kakaoMarkers.length > 0) {
                clusterRef.current.addMarkers(kakaoMarkers);
              }
            }
          }
        };

        // 초기 지도 영역 설정
        mapBoundsRef.current = kakaoMapInstance.getBounds();

        // 컴포넌트 언마운트 시 이벤트 리스너 제거를 위한 리턴 함수
        return () => {
          try {
            if (window.kakao && window.kakao.maps && window.kakao.maps.event) {
              window.kakao.maps.event.removeListener(dragendListener);
              window.kakao.maps.event.removeListener(zoomChangedListener);
            }
          } catch (error) {
            // 오류 발생 시 무시
          }
        };
      } catch (error) {
        console.error("지도 초기화 중 오류 발생");
        setIsMapLoaded(false);
      }
    };

    // 지도 초기화 함수 호출
    initializeMap();
  }, [
    centerPosition.lat,
    centerPosition.lng,
    initMarkerImages,
    isCenterMode,
    currentZoomLevel,
    map,
    kakaoMapLoaded,
  ]);

  // 마커 제거 함수
  const removeMarker = useCallback(
    (markerId) => {
      try {
        // 해당 마커 찾기
        const currentMarkers = markersRef.current;
        const markerToRemove = currentMarkers.find(
          (marker) => marker.id === markerId
        );

        if (markerToRemove) {
          // 지도에서 마커 제거
          try {
            markerToRemove.marker.setMap(null);
          } catch (setMapError) {
            console.error("마커 지도에서 제거 중 오류:", setMapError);
          }

          // 인포윈도우가 있다면 닫기
          if (markerToRemove.overlay) {
            try {
              markerToRemove.overlay.setMap(null); // ✅ 커스텀 오버레이 닫기
            } catch (closeError) {
              console.error("인포윈도우 닫기 중 오류:", closeError);
            }
          }

          // 클러스터에서도 제거
          if (clusterRef.current) {
            try {
              clusterRef.current.removeMarker(markerToRemove.marker);
            } catch (clusterError) {
              console.error("클러스터에서 마커 제거 중 오류:", clusterError);
            }
          }

          // 마커 목록에서 제거
          setMarkers((prev) => {
            const updatedMarkers = prev.filter(
              (marker) => marker.id !== markerId
            );

            // 보이는 마커 목록도 업데이트
            try {
              setVisibleMarkers((prev) =>
                prev.filter((marker) => marker.id !== markerId)
              );
            } catch (visibleError) {
              console.error("보이는 마커 업데이트 중 오류:", visibleError);
            }

            return updatedMarkers;
          });

          // 선택된 마커가 삭제되는 경우 선택 해제
          if (selectedMarker && selectedMarker.id === markerId) {
            setSelectedMarker(null);
          }
        }
      } catch (error) {
        console.error("마커 제거 중 예상치 못한 오류:", error);
      }
    },
    [selectedMarker]
  );

  // 마커 추가 함수 - 버튼 클릭 시 사용되는 함수(모달 표시)
  const addMarker = (position, markerType = "댕플", subType = null) => {
    setTempMarkerType(markerType);
    setTempMarkerSubType(subType);
    setShowModal(true);
    setIsCenterMode(true);
  };

  // 모달에서 확정 버튼 클릭 시 실제 마커 생성 함수 제리 수정
  const createMarkerFromModal = useCallback(async () => {
    if (!map) return;

    try {
      // 인증 상태 확인
      if (!isAuthenticated) {
        toast.error("로그인 후 이용해주세요!", {
          position: "bottom-center",
          autoClose: 2000,
          style: {
            background: "#fff5f5",
            color: "#a94442",
            border: "1px solid #f5c6cb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontWeight: "bold",
          },
          icon: "🔐",
        });
        setShowModal(false);
        setIsCenterMode(false);
        return;
      }

      const MIN_MARKER_ZOOM_LEVEL = 5;
      // 줌 레벨 검사
      if (map.getLevel() > MIN_MARKER_ZOOM_LEVEL) {
        toast.warn("지도를 확대하여 정확한 위치에 마커를 찍어주세요!", {
          position: "bottom-center",
          autoClose: 1000,
          style: {
            background: "#fff5f5",
            color: "#a94442",
            border: "1px solid #f5c6cb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontWeight: "bold",
            whiteSpace: "nowrap",        // 👈 한 줄로 유지
            maxWidth: "none",            // 👈 너비 제한 제거
            width: "fit-content",        // 👈 내용만큼 너비
            padding: "12px 16px",        // 👈 여백 여유롭게
            fontSize: "14px",            // 👈 텍스트 크기 조정 (선택)
          },
          icon: "🔍",
        });
        return null;
      }
      const center = map.getCenter();

      // 서버에 등록 요청
      const markerData = {
        type: getMarkerTypeCode(tempMarkerType, tempMarkerSubType),
        latitude: center.getLat(),
        longitude: center.getLng(),
      };

      const res = await registerMarker(markerData);
      const serverMarker = res.data.data;

      if (res.data.message !== "marker_registered_success") {
        toast.error("마커 등록 중 오류가 발생했습니다!", {
          position: "bottom-center",
          autoClose: 2000,
          style: {
            background: "#fff5f5",
            color: "#a94442",
            border: "1px solid #f5c6cb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontWeight: "bold",
          },
          icon: "❌",
        });
        return;
      }

      // 이미지 처리
      const markerImage =
        tempMarkerType === "댕플"
          ? markerImages.current[0].image
          : markerImages.current[1][tempMarkerSubType] ||
          markerImages.current[1].image;

      const marker = new window.kakao.maps.Marker({
        position: center,
        map,
        image: markerImage,
      });

      // 서버에서 닉네임 받아오기
      const nicknameRes = await getNicknameByUserId(user.userId);
      const nickname = nicknameRes.data.data.nickname;

      // ✅ 반려견 정보 받아오기
      let petName = null;
      let petImage = null;
      try {
        console.log("🐶 반려견 정보 요청 보내기 전...");
        const petRes = await getPetInfoByUserId(user.userId);
        console.log("🐶 반려견 응답:", petRes.data);
        petName = petRes.data.name;
        petImage = petRes.data.profileImage;
      } catch (e) {
        console.warn("🐶 반려견 정보 없음 또는 에러:", e);
      }

      const markerInfo = {
        id: serverMarker.id, // 서버에서 받은 ID
        user_id: user.userId, // 사용자 ID
        marker,
        position: {
          lat: serverMarker.latitude,
          lng: serverMarker.longitude,
        },
        type: tempMarkerType,
        subType: tempMarkerSubType,
        nickname,
        petName,  
        petImage,
      };
      console.log('markerinfo', markerInfo);

      // 상태 업데이트
      setMarkers((prev) => [...prev, markerInfo]);

      // 클릭 이벤트 (인포윈도우 + 삭제) createMarkerFromModal (방금만든 마커 모달 클릭시)
      window.kakao.maps.event.addListener(marker, "click", async () => {
        // 기존 오버레이 닫기
        markersRef.current.forEach((m) => {
          if (m.overlay) m.overlay.setMap(null);
        });

        // 줌 레벨 별로 마커 모달창 뜨는 위치 조절
        const getLatOffsetByZoom = (zoomLevel) => {
          // 줌 레벨: 1 (가장 확대됨) ~ 14 (가장 축소됨)
          // 보통 3~6 사이 사용함
          switch (zoomLevel) {
            case 1:
              return 0.0003;
            case 2:
              return 0.0007;
            case 3:
              return 0.001;
            case 4:
              return 0.0013;
            case 5:
              return 0.0016;
            case 6:
              return 0.002;
            case 7:
            case 8:
              return 0.0025;
            default:
              return 0.003; // 멀리 있는 경우
          }
        };

        // 마커 클릭 시 지도 이동 및 지도 확대
        const position = marker.getPosition();
        const zoomLevel = map.getLevel();
        console.log(zoomLevel);
        const offset = getLatOffsetByZoom(zoomLevel);
        const adjustedLat = position.getLat() + offset;
        const adjustedPosition = new window.kakao.maps.LatLng(adjustedLat, position.getLng());

        map.panTo(adjustedPosition);

        setTimeout(() => {
          if (map.getLevel() > 4) {
            map.setLevel(3);
          }
        }, 300);

        const { type, subType, nickname, petName, petImage } = markerInfo;
        console.log(nickname, petName, petImage );

        const emoji =
          tempMarkerType === "댕플"
            ? "🐶"
            : tempMarkerSubType
              ? MARKER_IMAGES.EMOJI[tempMarkerSubType] || "⚠️"
              : "⚠️";

              const infoContent = `
            <div class="custom-overlay-animate" style="
              position: relative;
              padding: 16px 14px 14px;
              background: #ffffff;
              border-radius: 18px;
              box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
              width: 220px;
              border: 1px solid #eee;
              font-family: 'Arial', sans-serif;
              font-size: 14px;
              text-align: center;
            ">
              <!-- 헤더 -->
              <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                position: relative;
                font-weight: bold;
                font-size: 15px;
                margin-bottom: 10px;
                color: #222;
              ">
                <span style="font-size: 20px;">${emoji}</span>
                <span>${type}${subType ? ` - ${subType}` : ""}</span>
                <button id="close-overlay-${markerInfo.id}" style="
                  position: absolute;
                  top: -10px;
                  right: -2px;
                  background: transparent;
                  border: none;
                  font-size: 24px;
                  color: #aaa;
                  cursor: pointer;
                ">&times;</button>
              </div>
          
              <!-- 등록자 -->
              <div style="margin-bottom: 10px; font-size: 13px; color: #666;">
                등록자 <strong style="color: #333;">${nickname}</strong>
              </div>
          
              <!-- 반려견 정보 -->
              <div style="margin-bottom: 12px;">
                ${
                  petName
                    ? `
                      <img 
                        src="${petImage || '/images/default-pet.png'}" 
                        alt="${petName}" 
                        onerror="this.onerror=null; this.src='/images/default-pet.png';"
                        style="width: 70px; height: 70px; border-radius: 12px; object-fit: cover; display: block; margin: 0 auto 6px;"
                      />
                      <div style="font-size: 13px; color: #333;">${petName}</div>
                    `
                    : `
                      <img 
                        src="/images/default-pet.png" 
                        alt="기본 이미지" 
                        style="width: 70px; height: 70px; border-radius: 12px; object-fit: cover; display: block; margin: 0 auto 6px; opacity: 0.85;"
                      />
                      <div style="font-size: 12px; color: #bbb;">반려견이 등록되지 않았어요</div>
                    `
                }
              </div>
          
              <!-- 삭제 버튼 -->
              ${
                user?.userId == markerInfo.user_id
                  ? `<button id="delete-marker-${markerInfo.id}" style="
                      padding: 7px 14px;
                      background: #f87171;
                      color: white;
                      border: none;
                      border-radius: 8px;
                      cursor: pointer;
                      font-size: 13px;
                      font-weight: 600;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.12);
                    ">삭제</button>`
                  : ""
              }
            </div>
          `;

        const overlay = new window.kakao.maps.CustomOverlay({
          content: infoContent, // 너가 만든 HTML
          position: marker.getPosition(),
          xAnchor: 0.5,
          yAnchor: 1.1, // 창뜨는 위치
          removable: true,
          zIndex: 9999, // ✅ 마커보다 높은 z-index 설정
        });

        overlay.setMap(map);
        markerInfo.overlay = overlay;

        setTimeout(() => {
          const deleteBtn = document.getElementById(`delete-marker-${markerInfo.id}`);
          if (deleteBtn) {
            deleteBtn.onclick = async () => {
              try {
                await deleteMarker(markerInfo.id);
                overlay.setMap(null); // ✅ 커스텀 오버레이 닫기

                // 👇 클러스터도 비우고 다시 마커를 불러와 강제 동기화
                if (clusterRef.current) {
                  clusterRef.current.clear();
                }

                fetchMarkersFromBackend(); // 🔁 최신 데이터로 다시 로드
                // ✅ 토스트 메시지 추가
                toast.success("마커가 삭제되었습니다!", {
                  position: "bottom-center",
                  autoClose: 2000,
                  style: {
                    background: "#fffaf0", // 밝은 베이지
                    color: "#4b2f1c", // 부드러운 갈색 텍스트
                    border: "1px solid #f3e5ab", // 연한 베이지 테두리
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    fontWeight: "bold",
                  },
                  icon: "🗑",
                });
              } catch (err) {
                console.error("삭제 실패:", err);
                alert("삭제 권한이 없거나 로그인되지 않았습니다.");
              }
            };
          } 

          const closeBtn = document.getElementById(`close-overlay-${markerInfo.id}`);
          if (closeBtn) {
            closeBtn.onclick = () => {
              overlay.setMap(null);
            };
          }
        }, 100);

        setSelectedMarker(markerInfo);
      });

      // 클러스터에 추가
      if (
        mapBoundsRef.current &&
        mapBoundsRef.current.contain(center) &&
        clusterRef.current
      ) {
        setTimeout(() => {
          setVisibleMarkers((prev) => [...prev, markerInfo]);
          try {
            clusterRef.current.addMarker(marker);
          } catch (e) {
            console.warn("클러스터 추가 실패:", e);
          }
        }, 10);
      }

      setIsCenterMode(false);
      ////console.log(...)
      toast.success("마커가 등록되었습니다!", {
        position: "bottom-center",
        autoClose: 500,
        style: {
          background: "#e8f5e9", // 연한 초록
          color: "#2e7d32", // 진한 초록 텍스트
          border: "1px solid #c8e6c9",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontWeight: "bold",
        },
        icon: "📍",
      });
      // 마커 등록 후 필터를 전체로 전환
      setFilterType("all");
      currentFilterTypeRef.current = "all";
      filterMarkersByType("all");

      return markerInfo;
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 401 || message === "required_authorization") {
        alert("로그인 후 이용해주세요");
      } else if (message === "duplicate_location") {
        toast.warn("같은 곳에 마커를 찍을 수 없어요!", {
          position: "bottom-center",
          autoClose: 2500,
          style: {
            background: "#fffbea",
            color: "#92400e",
            border: "1px solid #fde68a",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontWeight: "bold",
          },
          icon: "📍",
        });
        setIsCenterMode(false);
        setShowModal(false);
      } else if (message === "too_close_dangple") {
        toast.warn("댕플 주변에 너무 가깝게 찍을 수 없어요!", {
          position: "bottom-center",
          autoClose: 2500,
          style: {
            background: "#fff7ed",
            color: "#b45309",
            border: "1px solid #fcd34d",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontWeight: "bold",
          },
          icon: "🐶",
        });
        setIsCenterMode(false);
        setShowModal(false);
      } else if (message === "too_close_dangerous") {
        toast.warn("주변에 위험 정보가 이미 있어요!", {
          position: "bottom-center",
          autoClose: 2500,
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontWeight: "bold",
          },
          icon: "⚠️",
        });
        setIsCenterMode(false);
        setShowModal(false);
      } else if (message === "too_close_mixed") {
        toast.warn("댕플과 댕져러스는 너무 가까이 찍을 수 없어요 !", {
          position: "bottom-center",
          autoClose: 2500,
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontWeight: "bold",
          },
          icon: "⚠️",
        });
        setIsCenterMode(false);
        setShowModal(false);
      } else if (message === "limit_exceeded") {
        toast.warn("마커는 1시간에 최대 10개까지 등록돼요!", {
          position: "bottom-center",
          autoClose: 2500,
          style: {
            background: "#fffbea",
            color: "#92400e",
            border: "1px solid #fde68a",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontWeight: "bold",
          },
          icon: "⚠️",
        });
        // 마커 등록모드 해제
        setIsCenterMode(false);
        setShowModal(false);
      } else if (message === "same_marker_too_close") {
        toast.warn("같은 종류의 마커가 너무 가까이 있어요!", {
          position: "bottom-center",
          autoClose: 2500,
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontWeight: "bold",
          },
          icon: "⚠️",
        });
        setIsCenterMode(false);
        setShowModal(false);
      } else if (message?.includes("요청 횟수가 제한을 초과했습니다")) {
        toast.error("마커는 너무 자주 찍을 수 없어요! 잠시 후 다시 시도해주세요.", {
          position: "bottom-center",
          autoClose: 2500,
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            fontWeight: "bold",
            whiteSpace: "nowrap",       // 한 줄로 유지
            maxWidth: "none",           // 너비 제한 없앰
            width: "fit-content",       // 내용만큼만 너비 설정
            padding: "12px 16px",       // 여유 있는 패딩
            fontSize: "14px",           // 텍스트 크기
          },
          icon: "⛔",
        });
        setIsCenterMode(false);
        setShowModal(false);
      } else {
        console.error("❌ 마커 등록 중 오류:", error);
        setIsCenterMode(false);
        return null;
      }
    }
  }, [
    map,
    tempMarkerType,
    tempMarkerSubType,
    markerImages,
    getMarkerTypeCode,
    isAuthenticated,
  ]);

  // 현재 중앙 위치에 마커 추가하기
  const addMarkerAtCenter = useCallback(
    (type = "댕플", subType = null) => {
      if (!map || !addMarkerRef.current) return;

      // 마커 등록모드 시 필터링 전체로 변경
      setFilterType("all");
      currentFilterTypeRef.current = "all";
      filterMarkersByType("all");

      const center = map.getCenter();
      addMarkerRef.current(center, type, subType);
    },
    [map]
  );

  // 현재 중앙 위치에 댕져러스 서브타입 마커 추가하기
  const addDangerousMarkerWithSubType = useCallback(
    (subType) => {
      if (!map || !addMarkerRef.current) return;

      // 등록모드 시 필터 전체로 변경
      setFilterType("all");
      currentFilterTypeRef.current = "all";
      filterMarkersByType("all");

      const center = map.getCenter();
      addMarkerRef.current(center, "댕져러스", subType);
    },
    [map]
  );

  const moveToCurrentLocation = useCallback(() => {
    if (!map) {
      toast.error("지도가 아직 초기화되지 않았습니다!", {
        position: "bottom-center",
        autoClose: 2000,
      });
      return;
    }

    if (!navigator.geolocation) {
      toast.error("이 브라우저는 위치 정보를 지원하지 않아요.", {
        position: "bottom-center",
        autoClose: 2000,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const moveLatLng = new window.kakao.maps.LatLng(latitude, longitude);

        map.panTo(moveLatLng);
        if (map.getLevel() > 5) {
          map.setLevel(4);
        }
        setCenterPosition({ lat: latitude, lng: longitude });

        // 현재 위치 마커 표시
        showCurrentLocationMarker(latitude, longitude);

        // 이동한 위치 기준으로 마커 다시 불러오기!
        console.log("📍 현재 위치로 이동 완료:", latitude, longitude);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("브라우저 위치 권한을 허용해주세요!", {
              position: "bottom-center",
              autoClose: 1500,
            });
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("현재 위치 정보를 사용할 수 없습니다.", {
              position: "bottom-center",
              autoClose: 1500,
            });
            break;
          case error.TIMEOUT:
            toast.error("위치 정보를 가져오는 데 시간이 초과되었습니다.", {
              position: "bottom-center",
              autoClose: 1500,
            });
            break;
          default:
            toast.error(
              "위치 정보를 가져오는 중 알 수 없는 오류가 발생했습니다.",
              {
                position: "bottom-center",
                autoClose: 1000,
                style: {
                  whiteSpace: "nowrap",        // ✅ 한 줄로 유지
                  maxWidth: "none",            // ✅ 너비 제한 없앰
                  width: "fit-content",        // ✅ 내용 길이만큼만
                  padding: "12px 16px",
                  fontSize: "14px",
                },
              }
            );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [map]);

  // 마커 불러오기 (API > 카카오맵 Marker 생성)
  const fetchMarkersFromBackend = useCallback(async () => {
    ////console.log(...)

    if (!window.kakao || !window.kakao.maps) {
      console.warn("⚠️ 카카오맵이 아직 로드되지 않았습니다. 마커 로딩 중단");
      return;
    }

    // ✅ map이 없어도 기본 좌표로 fetch 시도
    const fallbackLat = 33.48717138746649; // 제주도 구름스퀘어
    const fallbackLng = 126.53171329989748;

    let centerLat = fallbackLat;
    let centerLng = fallbackLng;
    if (map) {
      try {
        const center = map.getCenter();
        centerLat = center.getLat();
        centerLng = center.getLng();
      } catch (e) {
        console.warn("❗️ map.getCenter() 실패, 기본 좌표 사용:", e);
      }
    } else {
      console.warn("❗️ map이 아직 없지만 기본 좌표로 마커 요청");
    }

    try {
      const params = {
        latitude: centerLat,
        longitude: centerLng,
        radius: 10000,
      };

      const res = await getMapMarkers(params);
      ////console.log(...)

      const markersData = res.data.data.markers;

      const newMarkers = [];

      markersData.forEach((mData) => {
        const position = new window.kakao.maps.LatLng(
          mData.latitude,
          mData.longitude
        );

        let type = "댕플";
        let subType = null;
        switch (mData.type) {
          case 1:
            type = "댕져러스";
            subType = "들개";
            break;
          case 2:
            type = "댕져러스";
            subType = "빙판길";
            break;
          case 3:
            type = "댕져러스";
            subType = "염화칼슘";
            break;
          case 4:
            type = "댕져러스";
            subType = "공사중";
            break;
        }

        const markerImage =
          type === "댕플"
            ? markerImages.current[0].image
            : markerImages.current[1][subType] || markerImages.current[1].image;

        const marker = new window.kakao.maps.Marker({
          position,
          map,
          image: markerImage,
        });

        const markerInfo = {
          id: mData.id, // ✅ 서버에서 내려준 진짜 마커 ID 사용
          user_id: mData.user_id, // ✅ 마커주인의 userId 저장
          marker,
          position: {
            lat: mData.latitude,
            lng: mData.longitude,
          },
          type,
          subType,
        };

        // ✅ 클릭 이벤트 + 삭제 API 연동 제리추가 (fetchMarkersFromBackend 내부)
        window.kakao.maps.event.addListener(marker, "click", async () => {
          // 오버레이 닫기
          markersRef.current.forEach((m) => {
            if (m.overlay) m.overlay.setMap(null);
          });

          // 마커 등록자 닉네임 가져오기
          const res = await getNicknameByUserId(markerInfo.user_id);
          const nickname = res.data.data.nickname;

          // 반려견 정보 가져오기
          let petName = null;
          let petImage = null;

          try {
            const petRes = await getPetInfoByUserId(markerInfo.user_id);
            petName = petRes.data.name;
            petImage = petRes.data.profileImage;
          } catch (error) {
            // const status = error.response?.status;
            // const message = error.response?.data?.message;

            // if (status === 404 && message === "not_found_pet") {
            //   // console.log("🐾 등록된 반려견이 없는 사용자입니다.");
            // } else {
            //   // console.error("🐾 반려견 정보 조회 중 오류:", error);
            // }
          }
          const emoji =
            type === "댕플" ? "🐶" : MARKER_IMAGES.EMOJI[subType] || "⚠️";

            const infoContent = `
            <div class="custom-overlay-animate" style="
              position: relative;
              padding: 16px 14px 14px;
              background: #ffffff;
              border-radius: 18px;
              box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
              width: 220px;
              border: 1px solid #eee;
              font-family: 'Arial', sans-serif;
              font-size: 14px;
              text-align: center;
            ">
              <!-- 헤더 -->
              <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                position: relative;
                font-weight: bold;
                font-size: 15px;
                margin-bottom: 10px;
                color: #222;
              ">
                <span style="font-size: 20px;">${emoji}</span>
                <span>${type}${subType ? ` - ${subType}` : ""}</span>
                <button id="close-overlay-${markerInfo.id}" style="
                  position: absolute;
                  top: -10px;
                  right: -2px;
                  background: transparent;
                  border: none;
                  font-size: 24px;
                  color: #aaa;
                  cursor: pointer;
                ">&times;</button>
              </div>
          
              <!-- 등록자 -->
              <div style="margin-bottom: 10px; font-size: 13px; color: #666;">
                등록자 <strong style="color: #333;">${nickname}</strong>
              </div>
          
              <!-- 반려견 정보 -->
              <div style="margin-bottom: 12px;">
                ${
                  petName
                    ? `
                      <img 
                        src="${petImage || '/images/default-pet.png'}" 
                        alt="${petName}" 
                        onerror="this.onerror=null; this.src='/images/default-pet.png';"
                        style="width: 70px; height: 70px; border-radius: 12px; object-fit: cover; display: block; margin: 0 auto 6px;"
                      />
                      <div style="font-size: 13px; color: #333;">${petName}</div>
                    `
                    : `
                      <img 
                        src="/images/default-pet.png" 
                        alt="기본 이미지" 
                        style="width: 70px; height: 70px; border-radius: 12px; object-fit: cover; display: block; margin: 0 auto 6px; opacity: 0.85;"
                      />
                      <div style="font-size: 12px; color: #bbb;">반려견이 등록되지 않았어요</div>
                    `
                }
              </div>
          
              <!-- 삭제 버튼 -->
              ${
                user?.userId == markerInfo.user_id
                  ? `<button id="delete-marker-${markerInfo.id}" style="
                      padding: 7px 14px;
                      background: #f87171;
                      color: white;
                      border: none;
                      border-radius: 8px;
                      cursor: pointer;
                      font-size: 13px;
                      font-weight: 600;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.12);
                    ">삭제</button>`
                  : ""
              }
            </div>
          `;

          const overlay = new window.kakao.maps.CustomOverlay({
            content: infoContent,
            position: marker.getPosition(),
            xAnchor: 0.5,
            yAnchor: 1.1,
            removable: true,
            zIndex: 9999,
          });

          // 마커 클릭 시 줌 확대 + 중앙 이동
          // 줌 레벨 별로 마커 모달창 뜨는 위치 조절
          const getLatOffsetByZoom = (zoomLevel) => {
            // 줌 레벨: 1 (가장 확대됨) ~ 14 (가장 축소됨)
            // 보통 3~6 사이 사용함
            switch (zoomLevel) {
              case 1:
                return 0.0003;
              case 2:
                return 0.0007;
              case 3:
                return 0.001;
              case 4:
                return 0.0013;
              case 5:
                return 0.0016;
              case 6:
                return 0.002;
              case 7:
              case 8:
                return 0.0025;
              default:
                return 0.003; // 멀리 있는 경우
            }
          };

          // 마커 클릭 시 지도 이동 및 지도 확대
          const position = marker.getPosition();
          const zoomLevel = map.getLevel();
          console.log(zoomLevel);
          const offset = getLatOffsetByZoom(zoomLevel);
          const adjustedLat = position.getLat() + offset;
          const adjustedPosition = new window.kakao.maps.LatLng(adjustedLat, position.getLng());
          map.panTo(adjustedPosition);

          setTimeout(() => {
            if (map.getLevel() > 4) {
              map.setLevel(3); // 줌인 약간 나중에
            }
          }, 300); // 약간의 시간차를 줘야 안정적으로 이동함

          overlay.setMap(map);
          markerInfo.overlay = overlay;

          // ✅ delete 버튼이 나타날 때까지 기다려서 이벤트 등록
          const tryAttachDeleteHandler = () => {
            const deleteBtn = document.getElementById(`delete-marker-${markerInfo.id}`);
            if (deleteBtn) {
              deleteBtn.onclick = async () => {
                try {
                  await deleteMarker(markerInfo.id);
                  overlay.setMap(null);
                  fetchMarkersFromBackend();

                  toast.success("마커가 삭제되었습니다!", {
                    position: "bottom-center",
                    autoClose: 2000,
                    style: {
                      background: "#fffaf0",
                      color: "#4b2f1c",
                      border: "1px solid #f3e5ab",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      fontWeight: "bold",
                    },
                    icon: "🐾",
                  });
                } catch (err) {
                  const message = err.response?.data?.message || "";

                  if (message === "required_authorization") {
                    toast.error("로그인 후 이용해주세요!", {
                      position: "bottom-center",
                      autoClose: 2000,
                      style: {
                        background: "#fff5f5",
                        color: "#a94442",
                        border: "1px solid #f5c6cb",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        fontWeight: "bold",
                      },
                      icon: "🔐",
                    });
                  } else if (message === "required_permission") {
                    toast.error("다른 유저의 마커를 삭제할 수 없습니다", {
                      position: "bottom-center",
                      autoClose: 2000,
                      style: {
                        background: "#fff5f5",
                        color: "#a94442",
                        border: "1px solid #f5c6cb",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        fontWeight: "bold",
                      },
                      icon: "⛔",
                    });
                  } else {
                    console.error("❌ 마커 삭제 실패:", err);
                    toast.error("마커 삭제 중 오류가 발생했습니다!", {
                      position: "bottom-center",
                      autoClose: 2000,
                      style: {
                        background: "#fff5f5",
                        color: "#a94442",
                        border: "1px solid #f5c6cb",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        fontWeight: "bold",
                      },
                      icon: "❌",
                    });
                  }
                }
              };
            } else {
              // 아직 버튼이 렌더링되지 않았다면 재시도
              setTimeout(tryAttachDeleteHandler, 50);
            }
          };

          tryAttachDeleteHandler();

          // 닫기 버튼도 추가
          const tryAttachCloseHandler = () => {
            const closeBtn = document.getElementById(
              `close-overlay-${markerInfo.id}`
            );
            if (closeBtn) {
              closeBtn.onclick = () => {
                overlay.setMap(null);
              };
            } else {
              setTimeout(tryAttachCloseHandler, 50);
            }
          };

          tryAttachCloseHandler();

          setSelectedMarker(markerInfo);
        });

        newMarkers.push(markerInfo);
      });

      setMarkers(newMarkers);

      // 바로 필터 적용
      filterMarkersByType(currentFilterTypeRef.current);
    } catch (error) {
      const message = error.response?.data?.message; // 응답 메시지
      const status = error.response?.status; // 응답 코드
      if (status === 401 || message === "required_authorization") {
        alert("로그인 후 이용해주세요!");
      } else {
        console.error("📛 마커 불러오기 실패:", error);
        toast.error("마커를 불러오는 중 오류가 발생했습니다!", {
          position: "bottom-center",
          autoClose: 2000,
        });
      }
    }
  }, [map, markerImages]);

  const hasFetchedMarkers = useRef(false); // 딱 한 번만 실행되게 플래그

  useEffect(() => {
    if (!hasFetchedMarkers.current && map && kakaoMapLoaded) {
      ////console.log(...)
      fetchMarkersFromBackend();
      hasFetchedMarkers.current = true;
    }
  }, [map, kakaoMapLoaded]);

  // 마커 타입 필터링 함수
  const filterMarkersByType = useCallback(
    (type) => {
      currentFilterTypeRef.current = type;
      setFilterType(type);

      const markersToShow = [];

      setMarkers((prev) => {
        return prev.map((markerInfo) => {
          let shouldShow = false;

          // 내 마커 필터링
          if (type === "mine") {
            shouldShow = isAuthenticated && markerInfo.user_id === user?.userId;
          } else {
            // 기존 방식
            shouldShow = markerInfo.type === type || type === "all";
          }

          // if (shouldShow) {
          //   markersToShow.push(markerInfo.marker);
          //   if (!markerInfo.marker.getMap()) {
          //     markerInfo.marker.setMap(map);
          //   }
          // } else {
          //   if (markerInfo.marker.getMap()) {
          //     markerInfo.marker.setMap(null);
          //   }
          // }

          // 항상 setMap(null) 처리해두기 (중복 방지) 모바일 위해
          markerInfo.marker.setMap(null);

          if (shouldShow) {
            markersToShow.push(markerInfo.marker);
          }

          return markerInfo;
        });
      });

      // 클러스터 새로 만들기 (생략 가능하긴 함)
      if (clusterRef.current) {
        clusterRef.current.clear();
        clusterRef.current.setMap(null);
      }


      // 클러스터 추가 전에 모든 마커 숨기기 모바일위해 추가
      markersRef.current.forEach((markerInfo) => {
        if (markerInfo.marker) {
          markerInfo.marker.setMap(null);
        }
      });

      clusterRef.current = createClustererWithStyle(map, type);

      setTimeout(() => {
        if (clusterRef.current) {
          const currentMarkers = markersRef.current;
          const bounds = map?.getBounds();
          if (bounds && currentMarkers) {
            const visibleFilteredMarkers = currentMarkers.filter(
              (markerInfo) => {
                const inBounds = bounds.contain(
                  markerInfo.marker.getPosition()
                );
                const isMine =
                  isAuthenticated && markerInfo.user_id === user?.userId;

                const matchesFilter =
                  type === "mine"
                    ? isMine
                    : type === "all" || markerInfo.type === type;

                return matchesFilter && inBounds;
              }
            );

            clusterRef.current.addMarkers(
              visibleFilteredMarkers.map((m) => m.marker)
            );
            setVisibleMarkers(visibleFilteredMarkers);
          }
        }
      }, 10);
    },
    [map, user, isAuthenticated]
  );

  // 컴포넌트 언마운트 시 마커 정리
  useEffect(() => {
    return () => {
      // 모든 마커 제거
      markers.forEach((markerInfo) => {
        if (markerInfo.marker) {
          markerInfo.marker.setMap(null);
        }
        if (markerInfo.overlay) {
          markerInfo.overlay.setMap(null); // ✅ 커스텀 오버레이 닫기
        }
      });
    };
  }, [markers]);

  // 네비게이션 함수 - AuthContext 사용하도록 수정
  const goToChat = useCallback(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // 로그인한 사용자는 채팅 페이지로 이동
    navigate("/chat");
  }, [navigate, isAuthenticated]);

  const goToProfile = useCallback(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // 로그인한 사용자는 프로필 페이지로 이동
    navigate("/profile");
  }, [navigate, isAuthenticated]);

  const goToPetInfo = useCallback(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // 로그인한 사용자는 반려견 정보 페이지로 이동
    navigate("/pets");
  }, [navigate, isAuthenticated]);

  // 서브타입 버튼 클릭 방식으로 변경
  const [showSubTypeButtons, setShowSubTypeButtons] = useState(false);

  // 함수 ref 추가
  // const getCurrentMapBoundsRef = useRef(null);
  // const fetchMarkersFromBackendRef = useRef(null);
  // const markerImagesRef = useRef(null);

  // 순환 참조를 방지하기 위한 함수 ref 업데이트
  useEffect(() => {
    removeMarkerRef.current = removeMarker;
    addMarkerRef.current = addMarker;
  }, [
    removeMarker,
    addMarker,
  ]);

  // 모달 뜰 때 모든 오버레이 닫기
  useEffect(() => {
    if (showModal) {
      markersRef.current.forEach((m) => {
        if (m.overlay) {
          try {
            m.overlay.setMap(null);
            m.overlay = null;
          } catch (e) {
            console.warn("모달 열릴 때 overlay 닫기 실패:", e);
          }
        }
      });
    }
  }, [showModal]);

  // 지도 클릭 이벤트에 서브타입 옵션 닫기 추가
  useEffect(() => {
    // 지도 컨테이너 클릭 이벤트 리스너 등록
    const handleMapClick = () => {
      if (showSubTypeButtons) {
        setShowSubTypeButtons(false);
      }
    };

    const mapDiv = mapContainer.current;
    if (mapDiv) {
      mapDiv.addEventListener("click", handleMapClick);
    }

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      if (mapDiv) {
        mapDiv.removeEventListener("click", handleMapClick);
      }
    };
  }, [showSubTypeButtons]);

  const handleCloseGuideModal = () => {
    setShowGuideModal(false); // ✅ 애니메이션 없이 바로 닫기
  };

  const handleDoNotShowAgain = () => {
    localStorage.setItem("hideGuideModal", "true");
    setShowGuideModal(false); // ✅ 그냥 바로 닫기
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {showGuideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-11/12 max-w-sm text-center relative">
            {/* 닫기 버튼 */}
            <button
              onClick={handleCloseGuideModal}
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>

            {/* 로고 이미지 */}
            <img
              src="/images/gangazido-logo-header.png"
              alt="Gangazido Logo"
              className="w-40 mx-auto mb-4"
            />

            {/* 안내 텍스트 */}
            <h2 className="text-lg font-bold mb-2">마커를 등록해보세요!</h2>
            <p className="text-sm text-gray-600 mb-4 leading-snug">
              오른쪽 위의 <strong>댕플</strong> 또는 <strong>댕져러스</strong>{" "}
              버튼을 눌러 <br></br> 마커를 추가할 수 있어요.
            </p>
            <br></br>
            <div className="text-xs text-gray-500 mb-4 space-y-1">
              <p>
                <strong>댕플</strong>: 반려견과의 행복한 장소를 기록해요 🐶
              </p>
              <p>
                <strong>댕져러스</strong>: 위험하거나 조심해야 할 장소를
                표시해요 ⚠️
              </p>
            </div>
            {/* 다시 보지 않기 */}
            <p className="text-[10px] text-gray-400 mt-2 leading-snug">
              ※ 마커는 너무 많이 찍으면 다른 이용자에게 불편을 줄 수 있어요. <br />
              꼭 필요한 장소만 등록해주세요!
            </p>
            <br></br>
            <p className="text-red-400 text-[10px] font-medium tracking-tight">
              ⛔ 마커는 1시간에 최대 10개까지만 등록할 수 있어요!
            </p>
            <br></br>
            <button
              onClick={handleDoNotShowAgain}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              다시 보지 않기
            </button>
          </div>
        </div>
      )}
      {/* 헤더 */}
      <header className="bg-white pt-2 pb-0 px-4 shadow-md flex items-center justify-center">
        <div className="flex items-center h-full gap-2">
          <img
            src="/gangazido-logo-header.png"
            alt="Gangazido Logo Header"
            className="h-14 w-28 object-cover self-center"
          />
        </div>
      </header>

      {/* 마커 생성 안내 */}
      {/* <div className="bg-amber-50 p-3 shadow-sm border-b border-amber-200">
        <p className="text-center text-amber-800 text-sm font-medium">
          {isCenterMode
            ? "지도를 움직여 중앙에 마커를 위치시키고 '확정' 버튼을 누르세요"
            : "댕플, 댕져러스 버튼을 눌러 마커를 추가하세요"}
        </p>
      </div> */}

      <ToastContainer
        position="bottom-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{ marginBottom: "65px" }} // 👈 여기
      />

      {/* 지도 영역 */}
      <div className="flex-1 bg-gray-200 relative">
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
            <div className="text-lg font-medium text-gray-600">
              지도를 불러오는 중...
            </div>
          </div>
        )}

        <div
          ref={mapContainer}
          className="absolute inset-0"
          style={{ width: "100%", height: "100%" }}
        ></div>

        {/* 중앙 마커 표시 (중앙 모드일 때) */}
        {isCenterMode && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-[60%] z-10 pointer-events-none">
            <div className="relative">
              <img
                src="/images/cross-mark.png"
                alt="중앙 마커"
                className="w-4 h-4" // tailwind 기준 크기 변경 10 : 40px?
              />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black bg-opacity-70 px-2 py-1 rounded text-white text-xs">
                지도를 움직여 위치 조정
              </div>
            </div>
          </div>
        )}

        {/* 현재 위치 이동 버튼 */}
        <div className="absolute bottom-3 right-3 z-30">
          <button
            onClick={moveToCurrentLocation}
            className="w-11 h-11 bg-white rounded-lg shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="내 위치로 이동"
          >
            <img
              src="/images/my-location.png" // 또는 퍼블릭 폴더 위치로 조정
              alt="내 위치 아이콘"
              className="w-6 h-6"
            />
          </button>
        </div>

        {/* 지도 영역 오른쪽 아래에 마커 유형별 추가 버튼 - 세로 정렬 */}
        {/* 댕플 & 댕져러스 버튼 */}
        <div className="absolute top-3 right-2 flex flex-col gap-4 z-20">
          <button
            onClick={() => {
              addMarkerAtCenter("댕플");
              setShowSubTypeButtons(false);
            }}
            className="flex flex-col items-center justify-center w-14 h-14 bg-yellow-100 border border-yellow-300 rounded-full shadow hover:scale-105 transition"
            aria-label="댕플 마커 추가"
          >
            <img
              src="/images/dangple_square.png"
              alt="댕플"
              className="w-6 h-6 object-contain"
            />
            <span className="text-[11px] font-semibold text-yellow-700 mt-1">
              댕플
            </span>
          </button>

          {/* 댕져러스 드롭다운 트리거 버튼 */}
          <div className="relative">
            <button
              onClick={() => setShowSubTypeButtons(!showSubTypeButtons)}
              className="flex flex-col items-center justify-center w-14 h-14 bg-red-100 border border-red-300 rounded-full shadow hover:scale-105 transition"
              aria-label="댕져러스 마커 추가"
            >
              <span className="text-[13px]">⚠️</span>
              <span className="text-[11px] font-bold text-red-700 mt-1">
                댕져러스
              </span>
            </button>

            {/* 드롭다운 메뉴 */}
            {showSubTypeButtons && (
              <div className="absolute top-full right-0 mt-2 flex flex-col gap-3 animate-fade-slide-down">
                {[
                  {
                    label: "들개",
                    icon: "/images/dog.png",
                    bg: "bg-rose-100",
                    text: "text-rose-700",
                    border: "border-rose-300",
                  },
                  {
                    label: "빙판길",
                    icon: "/images/icy.png",
                    bg: "bg-blue-100",
                    text: "text-blue-700",
                    border: "border-blue-300",
                  },
                  {
                    label: "염화칼슘",
                    icon: "/images/foot.png",
                    bg: "bg-green-100",
                    text: "text-green-700",
                    border: "border-green-300",
                  },
                  {
                    label: "공사중",
                    icon: "/images/construction.png",
                    bg: "bg-gray-100",
                    text: "text-gray-700",
                    border: "border-gray-300",
                  },
                ].map(({ label, icon, bg, text, border }) => (
                  <button
                    key={label}
                    onClick={() => {
                      addDangerousMarkerWithSubType(label);
                      setShowSubTypeButtons(false);
                    }}
                    className={`flex flex-col items-center justify-center w-14 h-14 ${bg} ${border} ${text} border rounded-full shadow hover:scale-105 transition`}
                    title={label}
                  >
                    <img
                      src={icon}
                      alt={label}
                      className="w-6 h-6 object-contain"
                    />
                    <span className="text-[11px] font-semibold mt-1">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 좌표 정보 표시 제리 주석 처리*/}
        {/* <div className="absolute bottom-36 left-0 right-0 flex justify-center">
          <div className="bg-white px-4 py-2 rounded-full shadow-md text-sm">
            <span className="font-medium">
              위도: {centerPosition.lat.toFixed(6)}, 경도:{" "}
              {centerPosition.lng.toFixed(6)}
            </span>
          </div>
        </div> */}

        {/* 지도 상단에 마커 타입 필터링 버튼 추가 - 배경 없이 왼쪽 정렬 */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          {[
            { label: "내 마커", value: "mine", color: "bg-green-500" },
            { label: "댕플", value: "댕플", color: "bg-amber-300" },
            { label: "댕져러스", value: "댕져러스", color: "bg-red-400" },
            { label: "전체", value: "all", color: "bg-gray-400" },
          ].map(({ label, value, color }) => (
            <button
              key={value}
              onClick={() => {
                if (value === "mine" && !isAuthenticated) {
                  toast.error("로그인 후 이용해주세요!", {
                    position: "bottom-center",
                    autoClose: 2000,
                    style: {
                      background: "#fff5f5",
                      color: "#a94442",
                      border: "1px solid #f5c6cb",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      fontWeight: "bold",
                    },
                    icon: "🔐",
                  });
                  return;
                }
                filterMarkersByType(value);
              }}
              className={`text-xs font-semibold py-2 px-3 rounded-full shadow transition ${filterType === value
                  ? `${color} text-white`
                  : "bg-white text-gray-600 border border-gray-300"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-between px-2">
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
          <button
            onClick={goToPetInfo}
            className="group flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-all duration-300"
          >
            <div className="relative">
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
            </div>
            <span className="text-xs mt-1 font-medium">반려견 정보</span>
          </button>
        </div>
      </nav>

      {/* 마커 생성 버튼 클릭 시 모달 (찍어멍) */}
      {showModal && (
        <div className="fixed bottom-24 inset-x-0 z-50 w-[90%] max-w-sm mx-auto animate-fade-up transition">
          <div className="bg-white/90 rounded-2xl shadow-xl border border-gray-200 px-5 py-4 text-center relative">
            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                setShowModal(false);
                setIsCenterMode(false);
              }}
              className="absolute top-2.5 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold"
              aria-label="모달 닫기"
            >
              ×
            </button>

            {/* 이모지 + 타이틀 */}
            <div className="mb-2 flex items-center justify-center gap-2">
              <span className="text-2xl">
                {tempMarkerType === "댕플"
                  ? "🐶"
                  : tempMarkerSubType
                    ? MARKER_IMAGES.EMOJI[tempMarkerSubType] || "⚠️"
                    : "⚠️"}
              </span>
              <h2 className="text-lg font-bold text-gray-800">
                {tempMarkerType === "댕플"
                  ? "댕플을 찍어멍!"
                  : tempMarkerSubType
                    ? `${tempMarkerSubType}을 찍어멍!`
                    : "댕져러스를 찍어멍!"}
              </h2>
            </div>

            {/* 설명 텍스트 */}
            <p className="text-sm text-gray-600 mb-4 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              지도를 움직여 위치를 정하고 아래 버튼을 눌러주세요
            </p>

            {/* 확정 버튼 */}
            <button
              onClick={async () => {
                const result = await createMarkerFromModal();
                if (result) {
                  setShowModal(false);
                }
              }}
              className="w-32 bg-black text-white py-2 rounded-full hover:bg-gray-900 font-semibold text-sm shadow-md transition"
            >
              확정
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapPage;
