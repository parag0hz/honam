import React, { useEffect, useState } from 'react';
import './MainPage.css';
import logo from '../assets/mainlogo.png';
import { FaBars, FaMapMarkerAlt, FaRegClipboard } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';



const MainPage = () => {
    const [nickname, setNickname] = useState('');
    const [messages, setMessages] = useState([
        { type: 'bot', text: '마음자리에 오신 걸 환영합니다. 무엇이든 편하게 이야기해 주세요.' }
    ]);
    const [inputValue, setInputValue] = useState('');

    // 닉네임 로컬 스토리지에서 불러오기
    useEffect(() => {
        const storedNickname = localStorage.getItem('nickname');
        if (storedNickname) {
            setNickname(storedNickname);
        }
    }, []);

    // 메시지 전송 함수
    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const newMessages = [...messages, { type: 'user', text: inputValue }];
        setMessages(newMessages);

        try {
            const response = await fetch("http://localhost:8000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: inputValue }),
            });

            const data = await response.json();
            setMessages([...newMessages, { type: 'bot', text: data.reply || "응답을 불러올 수 없습니다." }]);
        } catch (error) {
            console.error("Error:", error);
            setMessages([...newMessages, { type: 'bot', text: "서버와 연결할 수 없습니다." }]);
        }

        setInputValue('');
    };

    const navigate = useNavigate();


    return (
        <div className="page-wrapper">
            <div className="main-container">
                {/* 상단 헤더 */}
                <header className="header">
                    <img
                        src={logo}
                        alt="마음자리 로고"
                        className="logo"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/main')}
                    />
                    <span className="nickname-display">{nickname}님 환영합니다!</span>
                </header>

                {/* 채팅 영역 */}
                <main className="chat-container">
                    <div className="messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.type}`}>
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                        ))}
                    </div>
                </main>

                {/* 입력창 */}
                <footer className="footer">
                    <input
                        type="text"
                        placeholder="메세지를 입력해주세요"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button className="send-btn" onClick={handleSend}>⬆</button>
                </footer>

                {/* 하단 네비게이션 */}
                <nav className="bottom-nav">
                    <button onClick={() => navigate('/home')}><FaBars /></button>
                    <button onClick={() => navigate('/map')}><FaMapMarkerAlt /></button>
                    <button onClick={() => navigate('/report')}><FaRegClipboard /></button>
                </nav>
            </div>
        </div>
    );
};

export default MainPage;
