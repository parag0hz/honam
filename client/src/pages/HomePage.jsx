import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaMapMarkerAlt, FaRegClipboard, FaCalendarAlt, FaPen, FaHeartbeat, FaChartLine, FaHome } from 'react-icons/fa';
import logo from '../assets/mainlogo.png';
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedMood, setSelectedMood] = useState(null);
    const [weeklyMood, setWeeklyMood] = useState([3, 4, 2, 4, 3, 5, 4]);
    const [todayTip] = useState("스트레스를 받을 때는 천천히 심호흡을 하며 현재 순간에 집중해보세요. 3초 들이쉬고, 3초 참고, 3초 내쉬는 것을 반복해보세요.");

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        const name = "사용자"; // 실제로는 로그인된 사용자 이름

        if (hour < 6) return `🌙 늦은 밤이네요, ${name}님`;
        if (hour < 12) return `🌅 좋은 아침입니다, ${name}님`;
        if (hour < 18) return `☀️ 안녕하세요, ${name}님`;
        if (hour < 22) return `🌆 좋은 저녁입니다, ${name}님`;
        return `🌙 늦은 시간이네요, ${name}님`;
    };

    const getDateString = () => {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        };
        return currentTime.toLocaleDateString('ko-KR', options);
    };

    const moodOptions = [
        { emoji: '😢', label: '매우 나쁨', value: 1, color: '#f44336' },
        { emoji: '😔', label: '나쁨', value: 2, color: '#ff9800' },
        { emoji: '😐', label: '보통', value: 3, color: '#ffc107' },
        { emoji: '😊', label: '좋음', value: 4, color: '#8bc34a' },
        { emoji: '😄', label: '매우 좋음', value: 5, color: '#4caf50' }
    ];

    const handleMoodSelect = (mood) => {
        setSelectedMood(mood);
        // 실제로는 여기서 서버에 기분 데이터 저장
        setTimeout(() => {
            alert(`오늘의 기분이 "${mood.label}"로 기록되었습니다.`);
        }, 100);
    };

    const upcomingAppointments = [
        { date: '2025.07.15', time: '14:00', doctor: '김상담 심리상담사', type: '개인상담' },
        { date: '2025.07.18', time: '16:30', doctor: '박치료 정신건강의학과 전문의', type: '정기검진' }
    ];

    const quickActions = [
        {
            icon: <FaCalendarAlt />,
            title: '상담 예약',
            subtitle: '전문가와 상담하기',
            color: '#2196f3',
            onClick: () => alert('상담 예약 페이지로 이동합니다.')
        },
        {
            icon: <FaPen />,
            title: '마음 일기',
            subtitle: '오늘의 감정 기록',
            color: '#9c27b0',
            onClick: () => alert('마음 일기 작성 페이지로 이동합니다.')
        },
        {
            icon: <FaMapMarkerAlt />,
            title: '주변 병원',
            subtitle: '가까운 상담센터',
            color: '#ff5722',
            onClick: () => navigate('/map')
        },
        {
            icon: <FaChartLine />,
            title: '나의 통계',
            subtitle: '감정 변화 분석',
            color: '#00bcd4',
            onClick: () => navigate('/report')
        }
    ];

    const renderWeeklyChart = () => {
        const days = ['월', '화', '수', '목', '금', '토', '일'];
        const maxHeight = 40;

        return (
            <div className="weekly-chart">
                {weeklyMood.map((mood, index) => (
                    <div key={index} className="chart-day">
                        <div
                            className="chart-bar"
                            style={{
                                height: `${(mood / 5) * maxHeight}px`,
                                backgroundColor: moodOptions[mood - 1]?.color || '#ccc'
                            }}
                        />
                        <span className="chart-label">{days[index]}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
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
                <span className="time-display">{currentTime.toLocaleTimeString('ko-KR')}</span>
            </header>

            <main className="home-main">
                {/* 인사말 섹션 */}
                <section className="greeting-section">
                    <div className="greeting-card">
                        <h1 className="greeting-text">{getGreeting()}</h1>
                        <p className="date-text">{getDateString()}</p>
                        <div className="weather-info">
                            <span className="weather-icon">☀️</span>
                            <span className="weather-text">맑음, 23°C</span>
                        </div>
                    </div>
                </section>

                {/* 빠른 기분 체크 */}
                <section className="mood-check-section">
                    <div className="section-card">
                        <h2 className="section-title">
                            <FaHeartbeat className="section-icon" />
                            지금 기분이 어떠신가요?
                        </h2>
                        <div className="mood-options">
                            {moodOptions.map((mood) => (
                                <button
                                    key={mood.value}
                                    className={`mood-button ${selectedMood?.value === mood.value ? 'selected' : ''}`}
                                    onClick={() => handleMoodSelect(mood)}
                                    style={{
                                        borderColor: selectedMood?.value === mood.value ? mood.color : '#ddd'
                                    }}
                                >
                                    <span className="mood-emoji">{mood.emoji}</span>
                                    <span className="mood-label">{mood.label}</span>
                                </button>
                            ))}
                        </div>
                        {selectedMood && (
                            <div className="mood-feedback">
                                <p>오늘의 기분을 기록했습니다. 마음을 돌보는 것이 중요해요! 💙</p>
                            </div>
                        )}
                    </div>
                </section>

                <div className="dashboard-grid">
                    {/* 이번 주 감정 변화 */}
                    <section className="weekly-mood-section">
                        <div className="section-card">
                            <h3 className="section-title">이번 주 감정 변화</h3>
                            {renderWeeklyChart()}
                            <p className="chart-description">
                                이번 주 평균 기분: <strong style={{ color: '#4caf50' }}>좋음</strong>
                            </p>
                        </div>
                    </section>

                    {/* 다가오는 일정 */}
                    <section className="appointments-section">
                        <div className="section-card">
                            <h3 className="section-title">
                                <FaCalendarAlt className="section-icon" />
                                다가오는 상담 일정
                            </h3>
                            <div className="appointments-list">
                                {upcomingAppointments.length > 0 ? (
                                    upcomingAppointments.map((appointment, index) => (
                                        <div key={index} className="appointment-item">
                                            <div className="appointment-date">
                                                <span className="date">{appointment.date}</span>
                                                <span className="time">{appointment.time}</span>
                                            </div>
                                            <div className="appointment-details">
                                                <div className="doctor-name">{appointment.doctor}</div>
                                                <div className="appointment-type">{appointment.type}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-appointments">
                                        <p>예정된 상담이 없습니다.</p>
                                        <button className="book-appointment-btn">
                                            상담 예약하기
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                {/* 빠른 액션 버튼들 */}
                <section className="quick-actions-section">
                    <div className="section-card">
                        <h3 className="section-title">빠른 실행</h3>
                        <div className="quick-actions-grid">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    className="quick-action-button"
                                    onClick={action.onClick}
                                    style={{ '--action-color': action.color }}
                                >
                                    <div className="action-icon" style={{ color: action.color }}>
                                        {action.icon}
                                    </div>
                                    <div className="action-content">
                                        <div className="action-title">{action.title}</div>
                                        <div className="action-subtitle">{action.subtitle}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 오늘의 팁 */}
                <section className="daily-tip-section">
                    <div className="section-card tip-card">
                        <h3 className="section-title">💡 오늘의 마음 건강 팁</h3>
                        <div className="tip-content">
                            <p>{todayTip}</p>
                        </div>
                        <div className="tip-footer">
                            <small>매일 새로운 팁을 받아보세요</small>
                        </div>
                    </div>
                </section>
            </main>

            {/* 하단 네비게이션 */}
            <nav className="bottom-nav">
                <button onClick={() => navigate('/main')}><FaHome /></button>
                <button onClick={() => navigate('/home')} className="active"><FaBars /></button>
                <button onClick={() => navigate('/map')}><FaMapMarkerAlt /></button>
                <button onClick={() => navigate('/report')}><FaRegClipboard /></button>
            </nav>
        </div>
    );
};

export default HomePage;