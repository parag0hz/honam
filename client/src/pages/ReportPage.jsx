import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaMapMarkerAlt, FaRegClipboard } from 'react-icons/fa';
import logo from '../assets/mainlogo.png';
import './ReportPage.css';

const ReportPage = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState('2025.07.11');
    const [reports, setReports] = useState([]);

    // 샘플 보고서 데이터
    useEffect(() => {
        const sampleReports = [
            {
                date: '2025.07.11',
                title: '2025.07.11 보고서',
                mood: '보통',
                activities: [
                    '**일상 체크포인트를 통해 자신을 체크하도록 도와드립니다.**',
                    '1. **심리 상담센터를 찾을 필요가**',
                    '심리 상담을 받는 것은 약한 것이 아니라, 자신의 마음 건강을 위한 중요한 선택입니다. 전문가와 함께 이야기를 나누며 자신의 감정과 생각을 정리하고, 새로운 관점을 얻을 수 있습니다.',
                    '',
                    '2. **마음건강을 위한**',
                    '규칙적인 운동, 충분한 수면, 건강한 식단 등 기본적인 생활 습관을 유지하는 것이 중요합니다. 또한 명상이나 요가 같은 마음을 평온하게 하는 활동도 도움이 됩니다.',
                    '',
                    '3. **사회적 지지**',
                    '가족이나 친구들과의 관계를 소중히 여기고, 어려운 일이 있을 때는 주변 사람들에게 도움을 요청하는 것도 중요합니다. 혼자서 모든 것을 해결하려 하지 말고 함께 나누세요.',
                    '',
                    '4. **자기돌봄의 중요성**',
                    '자신만의 시간을 갖고 좋아하는 활동을 하며 스트레스를 해소하는 것이 중요합니다. 취미 생활이나 여가 활동을 통해 마음의 여유를 찾으시기 바랍니다.',
                    '',
                    '오늘도 하루를 잘 보내셨습니다. 작은 것들에도 감사하며 내일도 건강하고 행복한 하루가 되시길 바랍니다. 🌟'
                ]
            },
            {
                date: '2025.07.12',
                title: '2025.07.12 보고서',
                mood: '좋음',
                activities: [
                    '**오늘의 마음 상태를 점검해보세요.**',
                    '1. **긍정적인 하루 보내기**',
                    '오늘은 평소보다 기분이 좋았습니다. 작은 성취들이 쌓여 만족스러운 하루였습니다. 이런 긍정적인 에너지를 내일도 이어가보세요.',
                    '',
                    '2. **스트레스 관리**',
                    '스트레스가 있었지만 적절히 해소할 수 있었습니다. 산책이나 음악 감상 등의 방법이 도움이 되었습니다.',
                    '',
                    '3. **인간관계**',
                    '오늘 만난 사람들과의 대화가 즐거웠습니다. 소통의 중요성을 다시 한번 느꼈습니다.'
                ]
            },
            {
                date: '2025.07.13',
                title: '2025.07.13 보고서',
                mood: '나쁨',
                activities: [
                    '**힘든 하루를 보내셨네요.**',
                    '1. **감정 인정하기**',
                    '오늘은 조금 힘든 하루였습니다. 이런 감정도 자연스러운 것이니 자신을 탓하지 마세요.',
                    '',
                    '2. **휴식의 필요성**',
                    '충분한 휴식을 취하고, 마음을 달래줄 수 있는 활동을 찾아보세요.',
                    '',
                    '3. **내일은 새로운 시작**',
                    '오늘이 힘들었다고 해서 내일도 그럴 것은 아닙니다. 새로운 하루를 기대해보세요.'
                ]
            },
            {
                date: '2025.07.14',
                title: '2025.07.14 보고서',
                mood: '보통',
                activities: [
                    '**평범한 하루의 소중함**',
                    '1. **일상의 균형**',
                    '오늘은 특별할 것 없는 평범한 하루였지만, 이런 안정적인 일상도 소중합니다.',
                    '',
                    '2. **자기 성찰**',
                    '가끔은 이렇게 조용한 시간을 통해 자신을 되돌아보는 것도 좋습니다.'
                ]
            },
            {
                date: '2025.07.15',
                title: '2025.07.15 보고서',
                mood: '매우 좋음',
                activities: [
                    '**훌륭한 하루였습니다!**',
                    '1. **성취감**',
                    '오늘은 계획했던 일들을 잘 마무리할 수 있어서 뿌듯했습니다.',
                    '',
                    '2. **에너지 충전**',
                    '긍정적인 에너지가 가득한 하루였습니다. 이 기분을 오래 간직하세요.'
                ]
            }
        ];
        setReports(sampleReports);
    }, []);

    const getSelectedReport = () => {
        return reports.find(report => report.date === selectedDate) || reports[0];
    };

    const getMoodColor = (mood) => {
        switch (mood) {
            case '매우 좋음': return '#4caf50';
            case '좋음': return '#8bc34a';
            case '보통': return '#ffc107';
            case '나쁨': return '#ff9800';
            case '매우 나쁨': return '#f44336';
            default: return '#9e9e9e';
        }
    };

    const getMoodEmoji = (mood) => {
        switch (mood) {
            case '매우 좋음': return '😄';
            case '좋음': return '😊';
            case '보통': return '😐';
            case '나쁨': return '😔';
            case '매우 나쁨': return '😢';
            default: return '😐';
        }
    };

    const formatReportContent = (activities) => {
        return activities.map((activity, index) => {
            if (activity === '') {
                return <br key={index} />;
            }

            // 볼드 텍스트 처리
            if (activity.includes('**')) {
                const parts = activity.split('**');
                return (
                    <p key={index} style={{ margin: '8px 0', lineHeight: '1.5' }}>
                        {parts.map((part, partIndex) =>
                            partIndex % 2 === 1 ?
                                <strong key={partIndex}>{part}</strong> :
                                part
                        )}
                    </p>
                );
            }

            return (
                <p key={index} style={{ margin: '8px 0', lineHeight: '1.5' }}>
                    {activity}
                </p>
            );
        });
    };

    return (
        <div className="main-container">
            {/* 상단 헤더 */}
            <header className="header">
                <img
                    src={logo}
                    alt="마음자리 로고"
                    className="logo"
                    style={{ cursor: 'pointer' }} // 마우스 포인터 변경
                    onClick={() => navigate('/main')} // 클릭 시 /main으로 이동
                />
                <span className="nickname-display">마음 보고서</span>
            </header>

            <main className="report-main">
                {/* 왼쪽 날짜 목록 */}
                <div className="date-list-container">
                    <h2 className="date-list-title">보고서</h2>
                    <div className="date-list">
                        {reports.map((report, index) => (
                            <div
                                key={report.date}
                                className={`date-item ${selectedDate === report.date ? 'active' : ''}`}
                                onClick={() => setSelectedDate(report.date)}
                            >
                                <div className="date-text">{report.title}</div>
                                <div className="mood-indicator">
                                    <span
                                        className="mood-emoji"
                                        style={{ color: getMoodColor(report.mood) }}
                                    >
                                        {getMoodEmoji(report.mood)}
                                    </span>
                                    <span className="mood-text">{report.mood}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 오른쪽 보고서 내용 */}
                <div className="report-content-container">
                    {getSelectedReport() && (
                        <>
                            <div className="report-header">
                                <h1 className="report-title">{getSelectedReport().title}</h1>
                                <div className="report-mood">
                                    <span
                                        className="mood-emoji-large"
                                        style={{ color: getMoodColor(getSelectedReport().mood) }}
                                    >
                                        {getMoodEmoji(getSelectedReport().mood)}
                                    </span>
                                    <span className="mood-text-large">
                                        오늘의 기분: {getSelectedReport().mood}
                                    </span>
                                </div>
                            </div>

                            <div className="report-content">
                                <div className="welcome-message">
                                    <p>마음 체크포인트를 통해 오늘 하루를 되돌아보세요.</p>
                                </div>

                                <div className="activities-content">
                                    {formatReportContent(getSelectedReport().activities)}
                                </div>

                                <div className="report-footer">
                                    <p style={{
                                        textAlign: 'center',
                                        color: '#666',
                                        fontStyle: 'italic',
                                        marginTop: '30px',
                                        padding: '15px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px'
                                    }}>
                                        💙 마음자리가 함께 합니다. 오늘도 수고하셨어요! 💙
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* 하단 네비게이션 */}
            <nav className="bottom-nav">
                <button onClick={() => navigate('/home')}><FaBars /></button>
                <button onClick={() => navigate('/map')}><FaMapMarkerAlt /></button>
                <button onClick={() => navigate('/report')} className="active"><FaRegClipboard /></button>
            </nav>
        </div>
    );
};

export default ReportPage;