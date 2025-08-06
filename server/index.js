import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

// 환경변수 체크
if (!process.env.OPENAI_API_KEY) {
    console.error('❌ 오류: OPENAI_API_KEY 환경변수가 설정되지 않았습니다.');
    console.error('📝 해결방법:');
    console.error('1. .env.example 파일을 .env로 복사하세요');
    console.error('2. .env 파일에서 OPENAI_API_KEY를 설정하세요');
    console.error('3. 서버를 다시 시작하세요');
    process.exit(1);
}

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

// OpenAI 초기화
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 채팅 API
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // 또는 gpt-4o
            messages: [{ role: 'user', content: message }],
        });

        res.json({ reply: response.choices[0].message.content });
    } catch (error) {
        console.error('OpenAI API 오류:', error);
        res.status(500).json({ reply: '서버 오류 발생' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
