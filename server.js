import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Express server running natively, currently handling no active proxy routes.

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`✅ Staxiq proxy server running on http://localhost:${PORT}`);
});
