//chat.js
import api from './index';
const apiURL = window._env_?.API_BASE_URL;


// LLM 채팅 전송
export const sendLLMChat = (chatData) => {
  //chatData: { latitude, longitude, message }
  const token = localStorage.getItem('token');
  console.log(token);
  return api.post(`${apiURL}/v1/llm`, chatData);
};
