import * as Sentry from "@sentry/react";
import React from "react";
import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfilePage from "./pages/ProfilePage";
import ProfileEdit from "./pages/ProfileEdit";
import PasswordChange from "./pages/PasswordChange";
import MapPage from "./pages/MapPage";
import ChatPage from "./pages/ChatPage";
import PetInfo from "./pages/PetInfo";
import PetEdit from "./pages/PetEdit";
import PetRegister from "./pages/PetRegister";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  // 뷰포트 높이 설정을 위한 함수
  useEffect(() => {
    // 실제 뷰포트 높이를 계산하여 CSS 변수로 설정
    function setRealViewport() {
      // 모바일 브라우저의 주소창 등을 고려한 실제 가시영역 높이 계산
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);

      // Safari에서 100vh 문제 해결을 위한 추가 대응
      const appContainer = document.querySelector(".app-container");
      if (appContainer) {
        appContainer.style.height = `${window.innerHeight}px`;
      }

      const mobileContainer = document.querySelector(".mobile-container");
      if (mobileContainer) {
        mobileContainer.style.height = `${window.innerHeight}px`;
      }

      // 콘솔에 뷰포트 정보 출력 (디버깅용)
      //console.log(...)
    }

    // debounce 함수
    let resizeTimeout;
    function handleResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(setRealViewport, 100);
    }

    // 초기 로드 시 실행
    setRealViewport();

    // 리사이즈 및 방향 변경 이벤트 시 실행
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", () => {
      // 방향 전환 후 지연 시간을 두고 실행 (iOS Safari 대응)
      setTimeout(setRealViewport, 300);
    });

    // 스크롤 이벤트 방지
    function preventScroll(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }

    // 이중 탭 확대 방지
    function preventZoom(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }

    // 모바일 터치 이벤트에 대한 처리 추가
    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.addEventListener("touchstart", preventZoom, { passive: false });

    // 300ms 후 한번 더 계산 (일부 모바일 브라우저에서 초기 로드 시 높이가 정확하지 않을 수 있음)
    const timeoutId = setTimeout(setRealViewport, 300);
    // 1초 후에도 한번 더 계산 (추가 안정성을 위해)
    const secondTimeoutId = setTimeout(setRealViewport, 1000);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      document.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("touchstart", preventZoom);
      clearTimeout(timeoutId);
      clearTimeout(secondTimeoutId);
      clearTimeout(resizeTimeout);
    };
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await fetch("/v1/users/me", {
          credentials: "include",
        });
        const result = await res.json();
        if (res.ok && result?.data?.nickname) {
          Sentry.setUser({
            id: result.data.id,
            username: result.data.nickname,
          });
        }
      } catch (err) {
        console.error("Sentry 사용자 정보 로드 실패:", err);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <div className="app-container">
      <AuthProvider>
        <Router>
          <div className="App">
            <div className="mobile-container">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/map" element={<MapPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/edit" element={<ProfileEdit />} />
                  <Route
                    path="/profile/password"
                    element={<PasswordChange />}
                  />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/pets" element={<PetInfo />} />
                  <Route path="/pets/edit" element={<PetEdit />} />
                  <Route path="/pets/register" element={<PetRegister />} />
                </Route>
                <Route path="/" element={<Navigate to="/map" />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
