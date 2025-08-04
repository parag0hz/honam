import React, { useState } from "react";
import landingLogo from '../assets/landinglogo.png';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState('');

    const handleStart = () => {
        if (nickname.trim()) {
            localStorage.setItem('nickname', nickname); // 닉네임 저장
            navigate('/main');
        } else {
            alert("닉네임을 입력해주세요!");
        }
    };

    return (
        <div className="landing-container">
            <img src={landingLogo} alt="마음자리 로고" className="landing-logo" />
            <div className="input-section">
                <input
                    type="text"
                    placeholder="닉네임을 입력하세요"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="nickname-input"
                />
                <button onClick={handleStart} className="start-button">
                    시작하기
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
