import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaMapMarkerAlt, FaRegClipboard, FaHome } from 'react-icons/fa';
import logo from '../assets/mainlogo.png';
import './ReportPage.css';

const ReportPage = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState('');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [availableDates, setAvailableDates] = useState([]);

    // 사용 가능한 날짜 목록과 리포트 로드
    useEffect(() => {
        loadAvailableDates();
    }, []);

    const loadAvailableDates = async () => {
        try {
            // 먼저 샘플 데이터 로드
            loadSampleData();

            // 그 다음 실제 채팅 내역이 있는 날짜들 가져오기
            const response = await fetch('http://localhost:8000/chat-history');
            const data = await response.json();

            const realDates = Object.keys(data.chatHistory || {}).sort().reverse(); // 최신날짜 먼저

            // 샘플 날짜와 실제 날짜 합치기 (중복 제거)
            const sampleDates = availableDates.length > 0 ? availableDates : getSampleDates();
            const allDates = [...new Set([...realDates, ...sampleDates])].sort().reverse();

            setAvailableDates(allDates);

            if (allDates.length > 0 && !selectedDate) {
                setSelectedDate(allDates[0]); // 가장 최근 날짜 선택
            }
        } catch (error) {
            console.error('날짜 목록 로드 실패:', error);
            // 실패 시 샘플 데이터만 사용
            loadSampleData();
        }
    };

    const getSampleDates = () => {
        const today = new Date();
        const sampleDates = [];
        for (let i = 1; i <= 5; i++) { // 1일부터 5일 전까지
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            sampleDates.push(date.toISOString().split('T')[0]);
        }
        return sampleDates;
    };

    const loadSampleData = () => {
        const sampleDates = getSampleDates();
        setAvailableDates(sampleDates);

        if (!selectedDate) {
            setSelectedDate(sampleDates[0]);
        }

        // 샘플 보고서 데이터
        const sampleReports = [
            {
                date: sampleDates[0],
                title: `${sampleDates[0]} 마음 보고서`,
                mood: '좋음',
                content: '오늘은 마음자리와 의미 있는 대화를 나누었습니다.',
                activities: [
                    '**📝 오늘의 상담 요약**',
                    '마음자리와 함께 소중한 시간을 보내셨습니다. 자신의 감정을 표현하고 이야기를 나누는 것만으로도 큰 의미가 있습니다.',
                    '',
                    '**💭 감정 상태 체크**',
                    '오늘 하루 다양한 감정을 경험하셨을 것입니다. 긍정적인 변화의 조짐이 보입니다.',
                    '',
                    '**✨ 주요 성찰 포인트**',
                    '• 자신의 마음을 돌보려는 의지를 보여주셨습니다',
                    '• 솔직한 감정 표현을 통해 자기 이해가 깊어졌습니다',
                    '• 상담을 통해 새로운 관점을 얻으셨습니다',
                    '',
                    '**🌈 내일을 위한 제안**',
                    '1. 오늘의 깨달음을 일상에서 실천해보세요',
                    '2. 충분한 휴식을 취하시기 바랍니다',
                    '3. 자신에게 따뜻한 말을 건네보세요'
                ]
            },
            {
                date: sampleDates[1],
                title: `${sampleDates[1]} 마음 보고서`,
                mood: '보통',
                content: '평범하지만 소중한 하루를 보내셨습니다.',
                activities: [
                    '**📝 오늘의 상담 요약**',
                    '오늘은 일상의 소소한 고민들을 나누며 마음을 정리하는 시간을 가졌습니다.',
                    '',
                    '**💭 감정 상태 체크**',
                    '평온한 마음 상태를 유지하고 계십니다. 안정적인 감정 상태는 큰 자산입니다.',
                    '',
                    '**✨ 주요 성찰 포인트**',
                    '• 일상의 작은 변화에 민감하게 반응하는 섬세함',
                    '• 균형 잡힌 시각으로 상황을 바라보는 능력',
                    '• 꾸준한 자기 돌봄의 실천',
                    '',
                    '**🌈 내일을 위한 제안**',
                    '1. 평범한 일상에 감사하는 마음 갖기',
                    '2. 작은 변화라도 시도해보기',
                    '3. 자신만의 시간 확보하기'
                ]
            },
            {
                date: sampleDates[2],
                title: `${sampleDates[2]} 마음 보고서`,
                mood: '매우 좋음',
                content: '활기찬 하루를 보내셨네요!',
                activities: [
                    '**📝 오늘의 상담 요약**',
                    '오늘은 특히 긍정적인 에너지가 넘치는 하루였습니다. 여러 가지 좋은 일들이 있었던 것 같네요.',
                    '',
                    '**💭 감정 상태 체크**',
                    '매우 밝고 긍정적인 마음 상태입니다. 이런 좋은 에너지를 오래 유지해보세요.',
                    '',
                    '**✨ 주요 성찰 포인트**',
                    '• 긍정적 사고의 힘을 체험하셨습니다',
                    '• 주변 사람들과의 좋은 관계가 에너지원이 되었습니다',
                    '• 작은 성취들이 큰 만족감을 주었습니다',
                    '',
                    '**🌈 내일을 위한 제안**',
                    '1. 오늘의 좋은 기분을 기억해두세요',
                    '2. 긍정적인 경험을 일기로 기록해보세요',
                    '3. 주변 사람들에게 감사 인사를 전해보세요'
                ]
            },
            {
                date: sampleDates[3],
                title: `${sampleDates[3]} 마음 보고서`,
                mood: '나쁨',
                content: '조금 힘든 하루였지만 괜찮습니다.',
                activities: [
                    '**📝 오늘의 상담 요약**',
                    '오늘은 여러 어려움들이 있었던 하루였습니다. 이런 날도 있는 것이 자연스럽습니다.',
                    '',
                    '**💭 감정 상태 체크**',
                    '힘든 감정을 경험하고 계시지만, 이를 인정하고 표현하는 것 자체가 회복의 첫걸음입니다.',
                    '',
                    '**✨ 주요 성찰 포인트**',
                    '• 어려운 감정도 자연스러운 일부임을 인정',
                    '• 힘든 상황에서도 도움을 요청하는 용기',
                    '• 자신에 대한 이해와 수용의 자세',
                    '',
                    '**🌈 내일을 위한 제안**',
                    '1. 충분한 휴식을 취하세요',
                    '2. 자신을 다그치지 마세요',
                    '3. 작은 것이라도 즐거운 일을 찾아보세요',
                    '4. 필요하다면 주변에 도움을 요청하세요'
                ]
            },
            {
                date: sampleDates[4],
                title: `${sampleDates[4]} 마음 보고서`,
                mood: '좋음',
                content: '균형 잡힌 하루를 보내셨습니다.',
                activities: [
                    '**📝 오늘의 상담 요약**',
                    '오늘은 안정되고 균형 잡힌 하루를 보내셨습니다. 여러 일들을 차근차근 처리해나가셨네요.',
                    '',
                    '**💭 감정 상태 체크**',
                    '전반적으로 좋은 컨디션을 유지하고 계십니다. 마음의 안정감이 느껴집니다.',
                    '',
                    '**✨ 주요 성찰 포인트**',
                    '• 계획적이고 체계적인 생활 패턴',
                    '• 스트레스 상황에서도 침착함 유지',
                    '• 자기 관리에 대한 꾸준한 노력',
                    '',
                    '**🌈 내일을 위한 제안**',
                    '1. 현재의 좋은 루틴을 유지하세요',
                    '2. 새로운 도전도 고려해보세요',
                    '3. 자신의 성장을 인정하고 격려하세요'
                ]
            }
        ];

        setReports(prev => {
            // 기존 실제 리포트는 유지하고 샘플만 추가
            const realReports = prev.filter(report => !sampleDates.includes(report.date));
            return [...realReports, ...sampleReports];
        });
    };

    // 선택된 날짜가 변경될 때 리포트 생성
    useEffect(() => {
        if (selectedDate) {
            generateReport(selectedDate);
        }
    }, [selectedDate]);

    const generateReport = async (date, forceGenerate = false) => {
        // 샘플 날짜인지 확인
        const sampleDates = getSampleDates();
        if (sampleDates.includes(date) && !forceGenerate) {
            // 샘플 데이터는 이미 로드되어 있으므로 별도 처리 불필요
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ date })
            });

            const result = await response.json();

            // 디버깅을 위한 로그
            console.log('서버 응답:', result);

            if (result.success) {
                const newReport = {
                    date: result.date,
                    title: `${result.date} 전문 심리상담 리포트`,
                    mood: result.psychological_state?.dominant_emotion || '보통',
                    content: result.professional_report,
                    activities: result.professional_report ?
                        result.professional_report.split('\n').filter(line => line.trim()) : [],

                    // 새로운 전문 리포트 데이터
                    session_count: result.session_count,
                    three_line_summary: result.three_line_summary,
                    professional_report: result.professional_report,
                    psychological_state: result.psychological_state,
                    comparison_analysis: result.comparison_analysis,
                    recommendations: result.recommendations,
                    feedback_checklist: result.feedback_checklist,
                    checklist_link: result.checklist_link,
                    report_version: result.report_version,
                    generatedAt: result.generated_at || new Date().toISOString()
                };

                console.log('생성된 리포트 객체:', newReport);

                // 기존 리포트 업데이트 또는 추가 (샘플 데이터는 유지)
                setReports(prev => {
                    const filtered = prev.filter(r => r.date !== date);
                    return [newReport, ...filtered];
                });
            } else {
                console.warn('리포트 생성 실패:', result.message);
                // 채팅 내역이 없는 경우 기본 메시지
                const defaultReport = {
                    date: date,
                    title: `${date} 마음 보고서`,
                    mood: '보통',
                    content: '아직 오늘의 상담 내역이 없습니다. 마음자리 채팅을 통해 대화를 나눠보세요.',
                    activities: [
                        '**💭 아직 상담 내역이 없습니다**',
                        '',
                        '마음자리와 대화를 시작해보세요!',
                        '',
                        '🌟 채팅을 통해 마음을 나누면',
                        '• 하루의 감정을 정리할 수 있어요',
                        '• 개인화된 조언을 받을 수 있어요',
                        '• 성장과 변화를 기록할 수 있어요',
                        '',
                        '오늘도 마음자리가 함께 하겠습니다! 💙'
                    ],
                    recommendations: {}
                };
                setReports(prev => {
                    const filtered = prev.filter(r => r.date !== date);
                    return [defaultReport, ...filtered];
                });
            }
        } catch (error) {
            console.error('리포트 생성 오류:', error);
            // 오류 발생 시 안내 메시지
            const errorReport = {
                date: date,
                title: `${date} 마음 보고서`,
                mood: '보통',
                content: '리포트 생성 중 오류가 발생했습니다.',
                activities: [
                    '**⚠️ 리포트 생성 중 오류가 발생했습니다**',
                    '',
                    '잠시 후 다시 시도해주세요.',
                    '',
                    '문제가 계속 발생한다면:',
                    '• 인터넷 연결을 확인해주세요',
                    '• 외부 서버가 실행 중인지 확인해주세요',
                    '• 페이지를 새로고침해보세요'
                ],
                recommendations: {}
            };
            setReports(prev => {
                const filtered = prev.filter(r => r.date !== date);
                return [errorReport, ...filtered];
            });
        } finally {
            setLoading(false);
        }
    };

    // YouTube 검색 URL 생성 함수
    const generateYouTubeSearchUrl = (query) => {
        const encodedQuery = encodeURIComponent(query);
        return `https://www.youtube.com/results?search_query=${encodedQuery}`;
    };

    // Google 검색 URL 생성 함수
    const generateGoogleSearchUrl = (query) => {
        const encodedQuery = encodeURIComponent(query);
        return `https://www.google.com/search?q=${encodedQuery}`;
    };

    // 수동 리포트 생성 함수
    const handleManualGenerate = async () => {
        if (!selectedDate) return;

        const confirmGenerate = window.confirm(
            '새로운 리포트를 생성하시겠습니까?\n기존 리포트가 있다면 새로 생성된 내용으로 업데이트됩니다.'
        );

        if (confirmGenerate) {
            await generateReport(selectedDate, true); // forceGenerate = true
        }
    };

    const getMoodFromPsychState = (report) => {
        if (report.psychological_state?.dominant_emotion) {
            const emotion = report.psychological_state.dominant_emotion;
            // 감정을 기분으로 매핑
            switch (emotion) {
                case '긍정감': return '매우 좋음';
                case '좋음': return '좋음';
                case '우울감': return '나쁨';
                case '불안감': return '나쁨';
                case '분노감': return '매우 나쁨';
                case '스트레스': return '나쁨';
                default: return '보통';
            }
        }
        return report.mood || '보통';
    };

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
        if (!activities || activities.length === 0) return null;

        // 활동 배열을 하나의 텍스트로 합치기
        const fullText = activities.join('\n');

        // 마크다운 섹션별로 분리
        const sections = fullText.split('##').filter(section => section.trim());

        if (sections.length <= 1) {
            // 마크다운 섹션이 없는 경우 기존 방식 사용
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
        }

        // 마크다운 섹션이 있는 경우 섹션별로 렌더링
        return sections.map((section, index) => {
            const trimmedSection = section.trim();
            if (!trimmedSection) return null;

            // 섹션 제목과 내용 분리
            const lines = trimmedSection.split('\n');
            const title = lines[0].trim();
            const content = lines.slice(1).join('\n').trim();

            // 섹션 아이콘과 색상 결정
            const getSectionStyle = (title) => {
                if (title.includes('정서상태') || title.includes('감정')) {
                    return { icon: '📊', color: '#2196f3', bg: '#e3f2fd' };
                } else if (title.includes('주요 이슈') || title.includes('문제')) {
                    return { icon: '🎯', color: '#ff9800', bg: '#fff3e0' };
                } else if (title.includes('치료') || title.includes('개입')) {
                    return { icon: '💡', color: '#4caf50', bg: '#e8f5e8' };
                } else if (title.includes('실행계획') || title.includes('계획')) {
                    return { icon: '📋', color: '#9c27b0', bg: '#f3e5f5' };
                } else if (title.includes('변화') || title.includes('분석')) {
                    return { icon: '📈', color: '#607d8b', bg: '#eceff1' };
                } else {
                    return { icon: '📝', color: '#795548', bg: '#efebe9' };
                }
            };

            const style = getSectionStyle(title);

            return (
                <div key={index} className="report-section" style={{
                    backgroundColor: style.bg,
                    borderLeft: `4px solid ${style.color}`,
                    margin: '20px 0',
                    padding: '20px',
                    borderRadius: '8px'
                }}>
                    <h3 className="section-title" style={{
                        color: style.color,
                        margin: '0 0 15px 0',
                        fontSize: '18px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ fontSize: '20px' }}>{style.icon}</span>
                        {title}
                    </h3>
                    <div className="section-content">
                        <div style={{ lineHeight: '1.6' }}>
                            {content.split('\n').map((line, lineIndex) => {
                                if (!line.trim()) {
                                    return <br key={lineIndex} />;
                                }

                                // 불릿 포인트 처리
                                if (line.trim().startsWith('-')) {
                                    return (
                                        <p key={lineIndex} style={{
                                            margin: '4px 0 4px 20px',
                                            lineHeight: '1.6'
                                        }}>
                                            • {line.trim().substring(1).trim()}
                                        </p>
                                    );
                                }

                                // 볼드 텍스트 처리
                                const processedLine = line
                                    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: ' + style.color + '; font-weight: 600;">$1</strong>')
                                    .replace(/\*(.*?)\*/g, '<em>$1</em>');

                                return (
                                    <p key={lineIndex}
                                        style={{ margin: '8px 0', lineHeight: '1.6' }}
                                        dangerouslySetInnerHTML={{ __html: processedLine }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
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

            {/* 의료 면책 조항 */}
            <div className="medical-disclaimer-top">
                <div className="disclaimer-content">
                    <div className="disclaimer-text">
                        <span>마음자리는 의료 서비스가 아니며, 의료적 진단이나 조언을 제공하지 않습니다.</span>
                        <span>심리적 상태에 대한 진단이나 치료가 필요한 경우, 반드시 의료 전문가의 도움을 받아야합니다.</span>
                    </div>
                </div>
            </div>

            <main className="report-main">
                {/* 왼쪽 날짜 목록 */}
                <div className="date-list-container">
                    <h2 className="date-list-title">보고서</h2>
                    {loading && <div className="loading-indicator">리포트 생성 중...</div>}
                    <div className="date-list">
                        {availableDates.map((date, index) => {
                            const report = reports.find(r => r.date === date);
                            const mood = report ? getMoodFromPsychState(report) : '보통';
                            const sampleDates = getSampleDates();
                            const isSample = sampleDates.includes(date);

                            return (
                                <div
                                    key={date}
                                    className={`date-item ${selectedDate === date ? 'active' : ''}`}
                                    onClick={() => setSelectedDate(date)}
                                >
                                    <div className="date-text">
                                        {date} 보고서
                                        {isSample && <span className="sample-badge">예시</span>}
                                    </div>
                                    <div className="mood-indicator">
                                        <span
                                            className="mood-emoji"
                                            style={{ color: getMoodColor(mood) }}
                                        >
                                            {getMoodEmoji(mood)}
                                        </span>
                                        <span className="mood-text">{mood}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {availableDates.length === 0 && !loading && (
                            <div className="no-reports">
                                <p>아직 생성된 리포트가 없습니다.</p>
                                <p>마음자리와 대화를 나눠보세요! 💭</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 오른쪽 보고서 내용 */}
                <div className="report-content-container">
                    {getSelectedReport() && (
                        <>
                            <div className="report-header">
                                <div className="report-title-section">
                                    <h1 className="report-title">{getSelectedReport().title}</h1>
                                    <button
                                        className="generate-report-btn"
                                        onClick={handleManualGenerate}
                                        disabled={loading}
                                        title="리포트 새로 생성하기"
                                    >
                                        {loading ? '생성 중...' : '🔄 리포트 새로 생성'}
                                    </button>
                                </div>

                                {/* 심리상태 표시 */}
                                <div className="report-mood">
                                    <span
                                        className="mood-emoji-large"
                                        style={{ color: getMoodColor(getMoodFromPsychState(getSelectedReport())) }}
                                    >
                                        {getMoodEmoji(getMoodFromPsychState(getSelectedReport()))}
                                    </span>
                                    <span className="mood-text-large">
                                        {getSelectedReport().psychological_state ?
                                            `주요 정서: ${getSelectedReport().psychological_state.dominant_emotion}` :
                                            `오늘의 기분: ${getMoodFromPsychState(getSelectedReport())}`
                                        }
                                    </span>
                                </div>

                                {/* 세션 정보 */}
                                {getSelectedReport().session_count && (
                                    <div className="session-info">
                                        📊 상담 세션: {getSelectedReport().session_count}회
                                        {getSelectedReport().report_version && (
                                            <span className="version-badge">{getSelectedReport().report_version}</span>
                                        )}
                                    </div>
                                )}

                                {getSelectedReport().generatedAt && (
                                    <div className="report-timestamp">
                                        마지막 생성: {new Date(getSelectedReport().generatedAt).toLocaleString('ko-KR')}
                                    </div>
                                )}
                            </div>

                            <div className="report-content">
                                {/* 3줄 핵심 요약 */}
                                {getSelectedReport().three_line_summary && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%)',
                                        borderLeft: '5px solid #4caf50',
                                        padding: '25px',
                                        marginBottom: '30px',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: '-10px',
                                            right: '-10px',
                                            width: '60px',
                                            height: '60px',
                                            background: 'rgba(76, 175, 80, 0.1)',
                                            borderRadius: '50%'
                                        }} />
                                        <h3 style={{
                                            margin: '0 0 20px 0',
                                            color: '#2e7d32',
                                            fontSize: '32px', /* 20px에서 32px로 증가 */
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <span style={{ fontSize: '36px' }}>📋</span>
                                            핵심 요약
                                        </h3>
                                        {getSelectedReport().three_line_summary.map((line, index) => (
                                            <div key={index} style={{
                                                margin: '12px 0',
                                                padding: '12px 15px',
                                                background: 'rgba(255, 255, 255, 0.9)',
                                                borderRadius: '8px',
                                                borderLeft: '3px solid #4caf50',
                                                fontSize: '24px', /* 15px에서 24px로 증가 */
                                                lineHeight: '1.6',
                                                color: '#2e7d32',
                                                position: 'relative',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '10px'
                                            }}>
                                                <span style={{
                                                    background: '#4caf50',
                                                    color: 'white',
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '18px', /* 12px에서 18px로 증가 */
                                                    fontWeight: 'bold',
                                                    flexShrink: 0,
                                                    marginTop: '2px'
                                                }}>
                                                    {index + 1}
                                                </span>
                                                <span>{line}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 전문 리포트 */}
                                <div className="professional-report">
                                    <h3 style={{
                                        fontSize: '32px', /* 20px에서 32px로 증가 */
                                        fontWeight: '700',
                                        color: '#1976d2',
                                        marginBottom: '20px',
                                        paddingBottom: '10px',
                                        borderBottom: '3px solid #e3f2fd',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <span style={{ fontSize: '36px' }}>📊</span>
                                        전문 분석 리포트
                                    </h3>
                                    <div className="activities-content">
                                        {getSelectedReport().professional_report ? (
                                            <div style={{
                                                lineHeight: '1.8',
                                                color: '#333',
                                                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                                                padding: '25px',
                                                borderRadius: '12px',
                                                border: '1px solid #e9ecef',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                                fontSize: '20px' /* 기본 폰트 크기 추가 */
                                            }}>
                                                {/* 리포트를 라인별로 분리하여 렌더링 */}
                                                {getSelectedReport().professional_report.split('\n').map((line, index) => {
                                                    if (!line.trim()) {
                                                        return <div key={index} style={{ height: '12px' }} />;
                                                    }

                                                    // 제목 (## 로 시작하는 라인)
                                                    if (line.trim().startsWith('##')) {
                                                        const title = line.replace(/^#+\s*/, '');
                                                        const getSectionStyle = (title) => {
                                                            if (title.includes('정서상태') || title.includes('감정')) {
                                                                return { icon: '📊', color: '#2196f3', bg: 'linear-gradient(135deg, #e3f2fd 0%, #f8fffe 100%)', border: '#2196f3' };
                                                            } else if (title.includes('주요 이슈') || title.includes('문제')) {
                                                                return { icon: '🎯', color: '#ff9800', bg: 'linear-gradient(135deg, #fff3e0 0%, #fffef8 100%)', border: '#ff9800' };
                                                            } else if (title.includes('치료') || title.includes('개입')) {
                                                                return { icon: '💡', color: '#4caf50', bg: 'linear-gradient(135deg, #e8f5e8 0%, #f8fff8 100%)', border: '#4caf50' };
                                                            } else if (title.includes('실행계획') || title.includes('계획')) {
                                                                return { icon: '📋', color: '#9c27b0', bg: 'linear-gradient(135deg, #f3e5f5 0%, #fef8ff 100%)', border: '#9c27b0' };
                                                            } else if (title.includes('변화') || title.includes('분석')) {
                                                                return { icon: '📈', color: '#f44336', bg: 'linear-gradient(135deg, #ffebee 0%, #fef8f8 100%)', border: '#f44336' };
                                                            } else {
                                                                return { icon: '📝', color: '#607d8b', bg: 'linear-gradient(135deg, #eceff1 0%, #f8f9fa 100%)', border: '#607d8b' };
                                                            }
                                                        };
                                                        const style = getSectionStyle(title);
                                                        return (
                                                            <div key={index} style={{
                                                                background: style.bg,
                                                                borderLeft: `5px solid ${style.border}`,
                                                                margin: '25px 0',
                                                                padding: '20px 25px',
                                                                borderRadius: '10px',
                                                                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
                                                                transition: 'all 0.3s ease'
                                                            }}>
                                                                <h3 style={{
                                                                    color: style.color,
                                                                    margin: '0 0 15px 0',
                                                                    fontSize: '28px', /* 18px에서 28px로 증가 */
                                                                    fontWeight: '700',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '10px'
                                                                }}>
                                                                    <span style={{ fontSize: '32px' }}>{style.icon}</span>
                                                                    {title}
                                                                </h3>
                                                            </div>
                                                        );
                                                    }

                                                    // 불릿 포인트 (- 로 시작하는 라인)
                                                    if (line.trim().startsWith('-')) {
                                                        return (
                                                            <div key={index} style={{
                                                                margin: '12px 0 12px 25px',
                                                                lineHeight: '1.8',
                                                                color: '#555',
                                                                position: 'relative',
                                                                paddingLeft: '20px'
                                                            }}>
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    left: '0',
                                                                    top: '0',
                                                                    color: '#2196f3',
                                                                    fontSize: '24px', /* 16px에서 24px로 증가 */
                                                                    fontWeight: 'bold'
                                                                }}>•</span>
                                                                {line.trim().substring(1).trim()}
                                                            </div>
                                                        );
                                                    }

                                                    // 일반 텍스트
                                                    const processedLine = line
                                                        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1976d2; font-weight: 600; background: rgba(33, 150, 243, 0.1); padding: 2px 6px; border-radius: 4px;">$1</strong>')
                                                        .replace(/\*(.*?)\*/g, '<em style="color: #666; font-style: italic;">$1</em>');

                                                    return (
                                                        <p key={index}
                                                            style={{
                                                                margin: '15px 0',
                                                                lineHeight: '1.8',
                                                                color: '#555',
                                                                fontSize: '20px', /* 15px에서 20px로 증가 */
                                                                padding: '8px 0'
                                                            }}
                                                            dangerouslySetInnerHTML={{ __html: processedLine }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            formatReportContent(getSelectedReport().activities)
                                        )}
                                    </div>
                                </div>

                                {/* 비교 분석 */}
                                {getSelectedReport().comparison_analysis && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #fff3e0 0%, #fffef8 100%)',
                                        borderLeft: '5px solid #ff9800',
                                        padding: '25px',
                                        marginBottom: '30px',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: '-10px',
                                            right: '-10px',
                                            width: '60px',
                                            height: '60px',
                                            background: 'rgba(255, 152, 0, 0.1)',
                                            borderRadius: '50%'
                                        }} />
                                        <h3 style={{
                                            margin: '0 0 20px 0',
                                            color: '#f57c00',
                                            fontSize: '32px', /* 20px에서 32px로 증가 */
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <span style={{ fontSize: '36px' }}>📈</span>
                                            변화 분석
                                        </h3>
                                        <div style={{
                                            padding: '15px 20px',
                                            background: 'rgba(255, 255, 255, 0.9)',
                                            borderRadius: '8px',
                                            borderLeft: '3px solid #ff9800',
                                            fontSize: '20px', /* 15px에서 20px로 증가 */
                                            lineHeight: '1.8',
                                            color: '#e65100'
                                        }}>
                                            {getSelectedReport().comparison_analysis}
                                        </div>
                                    </div>
                                )}

                                {/* 콘텐츠 추천 */}
                                {getSelectedReport().recommendations && Object.keys(getSelectedReport().recommendations).length > 0 && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #f3e5f5 0%, #fef8ff 100%)',
                                        borderLeft: '5px solid #9c27b0',
                                        padding: '25px',
                                        marginBottom: '30px',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(156, 39, 176, 0.15)'
                                    }}>
                                        <h3 style={{
                                            margin: '0 0 25px 0',
                                            color: '#7b1fa2',
                                            fontSize: '32px', /* 20px에서 32px로 증가 */
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <span style={{ fontSize: '36px' }}>🎯</span>
                                            추천 콘텐츠
                                        </h3>

                                        {getSelectedReport().recommendations.youtube_videos && getSelectedReport().recommendations.youtube_videos.length > 0 && (
                                            <div style={{
                                                marginBottom: '20px',
                                                padding: '20px',
                                                background: 'rgba(255, 255, 255, 0.9)',
                                                borderRadius: '10px',
                                                border: '1px solid rgba(244, 67, 54, 0.2)',
                                                boxShadow: '0 2px 8px rgba(244, 67, 54, 0.08)'
                                            }}>
                                                <h4 style={{
                                                    margin: '0 0 15px 0',
                                                    color: '#d32f2f',
                                                    fontSize: '28px', /* 18px에서 28px로 증가 */
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <span style={{ fontSize: '32px' }}>📺</span>
                                                    추천 영상
                                                </h4>
                                                <ul style={{ margin: '0', paddingLeft: '0', listStyle: 'none' }}>
                                                    {getSelectedReport().recommendations.youtube_videos.map((video, index) => (
                                                        <li key={index} style={{
                                                            margin: '10px 0',
                                                            padding: '12px 15px',
                                                            background: 'rgba(244, 67, 54, 0.05)',
                                                            borderRadius: '8px',
                                                            borderLeft: '3px solid #f44336',
                                                            lineHeight: '1.5',
                                                            color: '#c62828',
                                                            fontSize: '18px', /* 폰트 크기 추가 */
                                                            position: 'relative',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                            onClick={() => window.open(generateYouTubeSearchUrl(video), '_blank')}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.background = 'rgba(244, 67, 54, 0.1)';
                                                                e.target.style.transform = 'translateX(5px)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.background = 'rgba(244, 67, 54, 0.05)';
                                                                e.target.style.transform = 'translateX(0)';
                                                            }}
                                                            title={`"${video}" YouTube에서 검색하기`}
                                                        >
                                                            <span style={{
                                                                color: '#f44336',
                                                                fontSize: '16px'
                                                            }}>▶</span>
                                                            {video}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {getSelectedReport().recommendations.books && getSelectedReport().recommendations.books.length > 0 && (
                                            <div style={{
                                                marginBottom: '20px',
                                                padding: '20px',
                                                background: 'rgba(255, 255, 255, 0.9)',
                                                borderRadius: '10px',
                                                border: '1px solid rgba(33, 150, 243, 0.2)',
                                                boxShadow: '0 2px 8px rgba(33, 150, 243, 0.08)'
                                            }}>
                                                <h4 style={{
                                                    margin: '0 0 15px 0',
                                                    color: '#1976d2',
                                                    fontSize: '28px', /* 18px에서 28px로 증가 */
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <span style={{ fontSize: '32px' }}>📚</span>
                                                    추천 도서
                                                </h4>
                                                <ul style={{ margin: '0', paddingLeft: '0', listStyle: 'none' }}>
                                                    {getSelectedReport().recommendations.books.map((book, index) => (
                                                        <li key={index} style={{
                                                            margin: '10px 0',
                                                            padding: '12px 15px',
                                                            background: 'rgba(33, 150, 243, 0.05)',
                                                            borderRadius: '8px',
                                                            borderLeft: '3px solid #2196f3',
                                                            lineHeight: '1.5',
                                                            color: '#1565c0',
                                                            fontSize: '18px', /* 폰트 크기 추가 */
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                            onClick={() => window.open(generateGoogleSearchUrl(`${book} 도서`), '_blank')}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.background = 'rgba(33, 150, 243, 0.1)';
                                                                e.target.style.transform = 'translateX(5px)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.background = 'rgba(33, 150, 243, 0.05)';
                                                                e.target.style.transform = 'translateX(0)';
                                                            }}
                                                            title={`"${book}" Google에서 검색하기`}
                                                        >
                                                            <span style={{
                                                                color: '#2196f3',
                                                                fontSize: '16px'
                                                            }}>📖</span>
                                                            {book}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {getSelectedReport().recommendations.articles && getSelectedReport().recommendations.articles.length > 0 && (
                                            <div style={{
                                                marginBottom: '20px',
                                                padding: '20px',
                                                background: 'rgba(255, 255, 255, 0.9)',
                                                borderRadius: '10px',
                                                border: '1px solid rgba(76, 175, 80, 0.2)',
                                                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.08)'
                                            }}>
                                                <h4 style={{
                                                    margin: '0 0 15px 0',
                                                    color: '#388e3c',
                                                    fontSize: '28px', /* 18px에서 28px로 증가 */
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <span style={{ fontSize: '32px' }}>📰</span>
                                                    추천 글
                                                </h4>
                                                <ul style={{ margin: '0', paddingLeft: '0', listStyle: 'none' }}>
                                                    {getSelectedReport().recommendations.articles.map((article, index) => (
                                                        <li key={index} style={{
                                                            margin: '10px 0',
                                                            padding: '12px 15px',
                                                            background: 'rgba(76, 175, 80, 0.05)',
                                                            borderRadius: '8px',
                                                            borderLeft: '3px solid #4caf50',
                                                            lineHeight: '1.5',
                                                            color: '#2e7d32',
                                                            fontSize: '18px', /* 폰트 크기 추가 */
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                            onClick={() => window.open(generateGoogleSearchUrl(article), '_blank')}
                                                            onMouseEnter={(e) => {
                                                                e.target.style.background = 'rgba(76, 175, 80, 0.1)';
                                                                e.target.style.transform = 'translateX(5px)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.background = 'rgba(76, 175, 80, 0.05)';
                                                                e.target.style.transform = 'translateX(0)';
                                                            }}
                                                            title={`"${article}" Google에서 검색하기`}
                                                        >
                                                            <span style={{
                                                                color: '#4caf50',
                                                                fontSize: '16px'
                                                            }}>📄</span>
                                                            {article}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 체크리스트 링크 */}
                                {getSelectedReport().checklist_link && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #e8eaf6 0%, #f3e5f5 100%)',
                                        borderLeft: '5px solid #673ab7',
                                        padding: '25px',
                                        marginBottom: '30px',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(103, 58, 183, 0.15)',
                                        textAlign: 'center',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: '-15px',
                                            left: '-15px',
                                            width: '70px',
                                            height: '70px',
                                            background: 'rgba(103, 58, 183, 0.1)',
                                            borderRadius: '50%'
                                        }} />
                                        <h3 style={{
                                            margin: '0 0 15px 0',
                                            color: '#512da8',
                                            fontSize: '20px',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px'
                                        }}>
                                            <span style={{ fontSize: '24px' }}>✅</span>
                                            상담 피드백
                                        </h3>
                                        <p style={{
                                            margin: '15px 0 20px 0',
                                            color: '#4527a0',
                                            fontSize: '15px',
                                            lineHeight: '1.6'
                                        }}>
                                            오늘 상담에 대한 피드백을 남겨주세요
                                        </p>
                                        <a
                                            href={getSelectedReport().checklist_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-block',
                                                background: 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)',
                                                color: 'white',
                                                textDecoration: 'none',
                                                padding: '15px 25px',
                                                borderRadius: '10px',
                                                fontWeight: '600',
                                                fontSize: '16px',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 4px 12px rgba(103, 58, 183, 0.3)',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 6px 16px rgba(103, 58, 183, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(103, 58, 183, 0.3)';
                                            }}
                                        >
                                            📝 피드백 작성하기
                                        </a>
                                    </div>
                                )}

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
                <button onClick={() => navigate('/main')}><FaHome /></button>
                <button onClick={() => navigate('/home')}><FaBars /></button>
                <button onClick={() => navigate('/map')}><FaMapMarkerAlt /></button>
                <button onClick={() => navigate('/report')} className="active"><FaRegClipboard /></button>
            </nav>
        </div>
    );
};

export default ReportPage;