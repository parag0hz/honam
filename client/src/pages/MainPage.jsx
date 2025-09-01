import React, { useEffect, useState } from 'react';
import './MainPage.css';
import logo from '../assets/mainlogo.png';
import { FaBars, FaMapMarkerAlt, FaRegClipboard, FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';



const MainPage = () => {
    const [nickname, setNickname] = useState('');
    const [messages, setMessages] = useState([
        { type: 'bot', text: '마음자리에 오신 걸 환영합니다. 무엇이든 편하게 이야기해 주세요.' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

    // 자동 스크롤을 위한 ref
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 메시지나 로딩 상태가 변경될 때 스크롤
    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // 닉네임과 채팅 내역을 로컬 스토리지에서 불러오기
    useEffect(() => {
        const storedNickname = localStorage.getItem('nickname');
        if (storedNickname) {
            setNickname(storedNickname);
        }

        // 오늘 날짜의 채팅 내역 불러오기
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
        const chatKey = `chat_history_${today}`;
        const storedMessages = localStorage.getItem(chatKey);

        if (storedMessages) {
            try {
                const parsedMessages = JSON.parse(storedMessages);
                // 기본 환영 메시지가 있는지 확인하고, 없으면 추가
                const hasWelcomeMessage = parsedMessages.some(msg =>
                    msg.type === 'bot' && msg.text.includes('마음자리에 오신 걸 환영합니다')
                );

                if (!hasWelcomeMessage && parsedMessages.length > 0) {
                    setMessages([
                        { type: 'bot', text: '마음자리에 오신 걸 환영합니다. 무엇이든 편하게 이야기해 주세요.' },
                        ...parsedMessages
                    ]);
                } else if (parsedMessages.length > 0) {
                    setMessages(parsedMessages);
                }
            } catch (error) {
                console.error('채팅 내역 불러오기 실패:', error);
            }
        }
    }, []);

    // 채팅 내역을 localStorage에 저장하는 함수
    const saveChatHistory = (newMessages) => {
        const today = new Date().toISOString().split('T')[0];
        const chatKey = `chat_history_${today}`;
        try {
            localStorage.setItem(chatKey, JSON.stringify(newMessages));
        } catch (error) {
            console.error('채팅 내역 저장 실패:', error);
        }
    };

    // 봇 응답 텍스트 포맷팅 함수 (문장 끝에 줄바꿈 추가)
    const formatBotResponse = (text) => {
        return text
            .replace(/([.!?])\s+/g, '$1\n') // 문장 끝 기호 뒤 공백을 한 번의 줄바꿈으로 변경
            .replace(/\n\n+/g, '\n') // 2개 이상의 연속 줄바꿈을 1개로 제한
            .trim(); // 앞뒤 공백 제거
    };

    // 메시지 전송 함수
    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return; // 로딩 중이면 전송 방지

        const newMessages = [...messages, { type: 'user', text: inputValue }];
        setMessages(newMessages);
        saveChatHistory(newMessages); // 사용자 메시지 저장
        setIsLoading(true); // 로딩 시작
        setInputValue(''); // 입력창 즉시 비우기

        try {
            const response = await fetch("http://localhost:8000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: inputValue }),
            });

            const data = await response.json();
            const formattedReply = formatBotResponse(data.reply || "응답을 불러올 수 없습니다.");
            const finalMessages = [...newMessages, { type: 'bot', text: formattedReply }];
            setMessages(finalMessages);
            saveChatHistory(finalMessages); // 봇 응답까지 포함해서 저장
        } catch (error) {
            console.error("Error:", error);
            const errorMessages = [...newMessages, { type: 'bot', text: "서버와 연결할 수 없습니다." }];
            setMessages(errorMessages);
            saveChatHistory(errorMessages); // 에러 메시지도 저장
        } finally {
            setIsLoading(false); // 로딩 종료
        }
    };

    // 채팅 내역 초기화 함수
    const clearChatHistory = () => {
        const confirmClear = window.confirm('오늘의 채팅 내역을 모두 삭제하시겠습니까?');
        if (confirmClear) {
            const today = new Date().toISOString().split('T')[0];
            const chatKey = `chat_history_${today}`;
            localStorage.removeItem(chatKey);

            const initialMessages = [{ type: 'bot', text: '마음자리에 오신 걸 환영합니다. 무엇이든 편하게 이야기해 주세요.' }];
            setMessages(initialMessages);
        }
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
                    <div className="header-center">
                        <span className="nickname-display">{nickname}님 환영합니다!</span>
                    </div>
                    <button
                        className="clear-chat-btn"
                        onClick={clearChatHistory}
                        title="채팅 내역 초기화"
                    >
                        🗑️
                    </button>
                </header>

                {/* 채팅 영역 */}
                <main className="chat-container">
                    <div className="messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.type}`}>
                                {msg.text}
                            </div>
                        ))}
                        {/* 로딩 메시지 */}
                        {isLoading && (
                            <div className="message bot loading">
                                <div className="loading-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        {/* 자동 스크롤을 위한 div */}
                        <div ref={messagesEndRef} />
                    </div>
                </main>

                {/* 하단 고정 영역 */}
                <div className="bottom-fixed-area">
                    {/* 입력창 */}
                    <footer className="footer">
                        <input
                            type="text"
                            placeholder={isLoading ? "응답을 기다리는 중..." : "메세지를 입력해주세요"}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isLoading}
                        />
                        <button
                            className={`send-btn ${isLoading ? 'loading' : ''}`}
                            onClick={handleSend}
                            disabled={isLoading}
                        >
                            {isLoading ? '⏳' : '⬆'}
                        </button>
                    </footer>

                    {/* 의료 면책 조항 */}
                    <div className="medical-disclaimer">
                        <div >
                            마음자리는 의료 서비스가 아니며, 의료적 진단이나 조언을 제공하지 않습니다.
                        </div>
                        <div>
                            심리적 상태에 대한 진단이나 치료가 필요한 경우, 반드시 의료 전문가의 도움을 받아야합니다.
                        </div>
                    </div>

                    {/* 하단 네비게이션 */}
                    <nav className="bottom-nav">
                        <button onClick={() => navigate('/main')}><FaHome /></button>
                        <button onClick={() => navigate('/home')}><FaBars /></button>
                        <button onClick={() => navigate('/map')}><FaMapMarkerAlt /></button>
                        <button onClick={() => navigate('/report')}><FaRegClipboard /></button>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default MainPage;
