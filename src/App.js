import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Main from './pages/Main';
import ChatMain from './pages/ChatMain';
import ChatDetail from './pages/ChatDetail';
import ProfileEdit from './pages/ProfileEdit';
import PasswordChange from './pages/PasswordChange';
import MemberWithdrawal from './pages/MemberWithdrawal';
import MapPage from './pages/MapPage';
import ChatService from './pages/ChatService';
import PetInfo from './pages/PetInfo';

function App() {
  return (
    <div className="app-container">
      <Router>
        <div className="App">
          <div className="mobile-container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/main" element={<Main />} />
              <Route path="/chat" element={<ChatMain />} />
              <Route path="/chat/:id" element={<ChatDetail />} />
              <Route path="/profile-edit" element={<ProfileEdit />} />
              <Route path="/password-change" element={<PasswordChange />} />
              <Route path="/profile/withdrawal" element={<MemberWithdrawal />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/chat-service" element={<ChatService />} />
              <Route path="/pet-info" element={<PetInfo />} />
              <Route path="/" element={<Navigate to="/map" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </div>
  );
}

export default App;
