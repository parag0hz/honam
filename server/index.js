import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

// 외부 서버 API 설정
const EXTERNAL_CHAT_URL = 'http://192.168.0.109:5003/chat';
const EXTERNAL_REPORT_URL = 'http://192.168.0.109:5004/report';
const MODEL_NAME = 'counseling-midm';

// 메모리에 채팅 내역 저장 (실제 운영에서는 데이터베이스 사용)
let chatHistory = [];

// 채팅 API
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        // 외부 서버 API 호출
        const response = await fetch(EXTERNAL_CHAT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message
            })
        });

        if (!response.ok) {
            throw new Error(`외부 서버 API 오류: ${response.status}`);
        }

        const data = await response.json();

        // 외부 서버 응답에서 텍스트 추출
        const reply = data.reply || data.response || data.message || '응답을 생성할 수 없습니다.';

        // 채팅 내역 저장 (날짜별로)
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
        const timestamp = new Date().toISOString();

        chatHistory.push({
            date: today,
            timestamp: timestamp,
            userMessage: message,
            assistantReply: reply
        });

        res.json({ reply });
    } catch (error) {
        console.error('외부 서버 API 오류:', error);
        // 외부 서버 연결 실패 시 안내
        if (error.code === 'ECONNREFUSED' || error.name === 'FetchError') {
            res.status(500).json({
                reply: '외부 상담 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
            });
        } else {
            res.status(500).json({
                reply: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
            });
        }
    }
});

// 리포트 생성 API
app.post('/generate-report', async (req, res) => {
    try {
        const { date } = req.body;
        const targetDate = date || new Date().toISOString().split('T')[0];

        // 해당 날짜의 채팅 내역 필터링
        const dayChats = chatHistory.filter(chat => chat.date === targetDate);

        if (dayChats.length === 0) {
            return res.json({
                success: false,
                message: '해당 날짜에 채팅 내역이 없습니다.',
                report: null
            });
        }

        // 채팅 내역을 하나의 텍스트로 결합
        const chatSummary = dayChats.map(chat =>
            `사용자: ${chat.userMessage}\n상담사: ${chat.assistantReply}`
        ).join('\n\n');

        // 이전 날짜 세션 가져오기
        const previousDate = new Date(targetDate);
        previousDate.setDate(previousDate.getDate() - 1);
        const prevDateStr = previousDate.toISOString().split('T')[0];
        const previousSession = chatHistory.filter(chat => chat.date === prevDateStr);
        const previousSummary = previousSession.length > 0 ?
            previousSession.map(chat => `${chat.userMessage} ${chat.assistantReply}`).join(' ') : null;

        // 외부 서버에 리포트 생성 요청 (포트 5004로 변경)
        const response = await fetch(EXTERNAL_REPORT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: targetDate,
                chatHistory: chatSummary,
                chatCount: dayChats.length,
                previousSession: previousSummary
            })
        });

        if (!response.ok) {
            throw new Error(`리포트 생성 서버 오류: ${response.status}`);
        }

        const reportData = await response.json();

        // 외부 서버 응답 로깅
        console.log('외부 서버 응답:', JSON.stringify(reportData, null, 2));

        // 응답 구조를 유연하게 처리
        if (reportData) {
            // success 필드가 없거나 true인 경우
            if (reportData.success !== false) {
                res.json({
                    success: true,
                    date: reportData.date || targetDate,
                    session_count: reportData.session_count || reportData.sessionCount || dayChats.length,
                    three_line_summary: reportData.three_line_summary || reportData.threeLlineSummary || reportData.summary || [],
                    professional_report: reportData.professional_report || reportData.professionalReport || reportData.report || reportData.content || '리포트가 생성되었습니다.',
                    psychological_state: reportData.psychological_state || reportData.psychologicalState || {},
                    comparison_analysis: reportData.comparison_analysis || reportData.comparisonAnalysis || reportData.analysis || '',
                    recommendations: reportData.recommendations || {},
                    feedback_checklist: reportData.feedback_checklist || reportData.feedbackChecklist || [],
                    checklist_link: reportData.checklist_link || reportData.checklistLink || '',
                    generated_at: reportData.generated_at || reportData.generatedAt || new Date().toISOString(),
                    report_version: reportData.report_version || reportData.reportVersion || 'v1.0'
                });
            } else {
                res.json({
                    success: false,
                    message: reportData.message || '리포트 생성에 실패했습니다.'
                });
            }
        } else {
            res.json({
                success: false,
                message: '외부 서버에서 응답을 받지 못했습니다.'
            });
        }

    } catch (error) {
        console.error('리포트 생성 오류:', error);

        // 외부 서버 연결 실패 시 로컬에서 간단한 리포트 생성
        if (error.code === 'ECONNREFUSED' || error.name === 'FetchError') {
            console.log('외부 서버 연결 실패, 로컬 리포트 생성');

            // 간단한 로컬 리포트 생성
            const simpleReport = `## 📊 상담 세션 분석

오늘 총 ${dayChats.length}회의 상담 세션이 진행되었습니다.

## 💭 주요 대화 내용

${dayChats.slice(0, 3).map((chat, index) =>
                `**세션 ${index + 1}:**\n- 사용자: ${chat.userMessage.slice(0, 50)}${chat.userMessage.length > 50 ? '...' : ''}\n- 상담사: ${chat.assistantReply.slice(0, 100)}${chat.assistantReply.length > 100 ? '...' : ''}\n`
            ).join('\n')}

## 🌈 오늘의 소감

오늘도 마음자리와 함께 소중한 시간을 보내셨습니다. 
${dayChats.length > 5 ? '활발한 대화를 나누셨네요!' : dayChats.length > 2 ? '의미있는 대화를 나누셨습니다.' : '첫 대화를 시작하셨습니다.'}

## 📋 내일을 위한 제안

- 오늘의 대화를 되돌아보며 자신의 감정을 정리해보세요
- 충분한 휴식을 취하시기 바랍니다
- 필요하다면 언제든 마음자리와 대화를 이어가세요`;

            res.json({
                success: true,
                date: targetDate,
                session_count: dayChats.length,
                three_line_summary: [
                    `오늘 총 ${dayChats.length}회의 상담을 진행했습니다.`,
                    '마음자리와 의미있는 대화를 나누었습니다.',
                    '꾸준한 자기 돌봄을 실천하고 계십니다.'
                ],
                professional_report: simpleReport,
                psychological_state: {
                    dominant_emotion: '보통',
                    confidence_level: 0.7
                },
                comparison_analysis: previousSummary ?
                    '이전 세션과 비교하여 꾸준한 상담 참여를 보이고 있습니다.' :
                    '새로운 상담을 시작하셨습니다.',
                recommendations: {
                    youtube_videos: ['마음챙김 명상', '긍정적 사고 훈련'],
                    books: ['마음챙김의 힘', '감정 조절 기술'],
                    articles: ['스트레스 관리법', '자기 돌봄의 중요성']
                },
                feedback_checklist: [],
                checklist_link: '',
                generated_at: new Date().toISOString(),
                report_version: 'local-v1.0'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '리포트 생성 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    }
});

// 채팅 내역 조회 API (디버깅용)
app.get('/chat-history', (req, res) => {
    const { date } = req.query;

    if (date) {
        const dayChats = chatHistory.filter(chat => chat.date === date);
        res.json({ date, chats: dayChats, count: dayChats.length });
    } else {
        // 날짜별로 그룹화
        const groupedByDate = chatHistory.reduce((acc, chat) => {
            if (!acc[chat.date]) {
                acc[chat.date] = [];
            }
            acc[chat.date].push(chat);
            return acc;
        }, {});

        res.json({ chatHistory: groupedByDate });
    }
});

// 테스트용 채팅 내역 추가 API
app.post('/add-test-chat', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();

    const testChats = [
        {
            userMessage: "안녕하세요, 요즘 스트레스가 많아서 상담을 받고 싶어요.",
            assistantReply: "안녕하세요! 스트레스를 받고 계시는군요. 어떤 부분에서 가장 힘드신가요? 구체적으로 말씀해주시면 함께 해결방법을 찾아보겠습니다."
        },
        {
            userMessage: "직장에서 업무량이 너무 많고 상사와의 관계도 어려워요.",
            assistantReply: "직장에서의 스트레스는 정말 힘드실 것 같습니다. 업무량 조절과 상사와의 소통 방법에 대해 함께 생각해보면 어떨까요? 먼저 우선순위를 정해서 업무를 체계적으로 정리해보시는 것을 추천드립니다."
        },
        {
            userMessage: "집에 가서도 일 생각만 나고 잠도 잘 안와요.",
            assistantReply: "일과 개인 시간의 경계가 모호해진 것 같네요. 퇴근 후에는 의식적으로 일을 내려놓는 루틴을 만들어보세요. 명상이나 가벼운 운동, 독서 등 마음을 진정시키는 활동을 추천드립니다."
        }
    ];

    testChats.forEach(chat => {
        chatHistory.push({
            date: today,
            timestamp: timestamp,
            userMessage: chat.userMessage,
            assistantReply: chat.assistantReply
        });
    });

    res.json({
        success: true,
        message: `${testChats.length}개의 테스트 채팅이 ${today} 날짜로 추가되었습니다.`,
        chatCount: testChats.length
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
