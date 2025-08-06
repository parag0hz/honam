import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

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
