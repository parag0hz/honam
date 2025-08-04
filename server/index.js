const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors()); // React에서 요청할 수 있도록 CORS 허용
app.use(express.json());

// 테스트 API
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from Node.js server!' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
