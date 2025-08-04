import React, { useEffect, useState } from 'react';
import './MainPage.css';
import logo from '../assets/mainlogo.png';
import { FaBars, FaMapMarkerAlt, FaRegClipboard } from 'react-icons/fa';

const MainPage = () => {
    const [nickname, setNickname] = useState('');

    useEffect(() => {
        const storedNickname = localStorage.getItem('nickname');
        if (storedNickname) {
            setNickname(storedNickname);
        }
    }, []);

    const [messages, setMessages] = useState([
        { type: 'bot', text: '그렇게 느껴지셔서 정말 안타깝네요. 뿅 구입은 ...' },
        { type: 'bot', text: '교수님을 그렇게 느끼고 계시다니 정말 죄송하고 힘듭...' },
        { type: 'bot', text: '응, 네가 왜 슬픈지 스스로도 잘 모르겠어서 더 답답한 마음을 ...' },
    ]);

    const [quickReplies] = useState([
        '우울해서 빵샀어',
        '교수님 정강이를 차고 싶어',
        '나 왜 슬프게 ?'
    ]);

    const [inputValue, setInputValue] = useState('');

    const handleSend = () => {
        if (!inputValue.trim()) return;
        setMessages([...messages, { type: 'user', text: inputValue }]);
        setInputValue('');
    };

    return (
        <div className="main-container">
            <header className="header">
                <img src={logo} alt="마음자리 로고" className="logo" />
                <span className="nickname-display">{nickname}님 환영합니다!</span>
            </header>

            <main className="chat-container">
                <div className="messages">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.type}`}>
                            {msg.text}
                        </div>
                    ))}
                </div>

                <div className="quick-replies">
                    {quickReplies.map((reply, idx) => (
                        <button key={idx} onClick={() => setMessages([...messages, { type: 'user', text: reply }])}>
                            {reply}
                        </button>
                    ))}
                </div>
            </main>

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

            <nav className="bottom-nav">
                <button><FaBars /></button>
                <button><FaMapMarkerAlt /></button>
                <button><FaRegClipboard /></button>
            </nav>
        </div>
    );
};

export default MainPage;
