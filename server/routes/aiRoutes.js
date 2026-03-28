const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/ai/fix - Analyze code error with Gemini
router.post('/fix', async (req, res) => {
    const { code, error, language } = req.body;

    if (!code || !error) {
        return res.status(400).json({ message: 'Code and error output are required.' });
    }

    // Lazy-initialize the client so dotenv has already run
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY is not set in environment variables.');
        return res.status(500).json({ message: 'AI service is not configured. Missing API key.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log(`[AI] Requesting analysis for ${language}...`);
        const model = genAI.getGenerativeModel({ model: 'gemma-3-4b-it' });
        const truncatedCode = code.length > 5000 ? code.substring(0, 5000) + '\n... [Remaining code truncated for brevity]' : code;

        const prompt = `You are an expert ${language} programming assistant inside a collaborative code editor. 
A user ran their code and got an error. Analyze and explain what went wrong, then provide the corrected code.

Language: ${language}

User's Code:
\`\`\`${language}
${truncatedCode}
\`\`\`

Error Output:
\`\`\`
${error}
\`\`\`

Instructions:
1. Start with a short, clear explanation of the root cause (1-2 sentences max).
2. List the specific line(s) that caused the issue.
3. Provide the corrected code in a code block.
4. End with one tip to avoid this in the future.

Keep your response concise and developer-friendly. Do NOT use overly formal language.`;

        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();

        res.json({ explanation: aiResponse });
    } catch (err) {
        const errorMsg = err.message || 'Unknown Gemini error';
        console.error(`[AI] Error for ${language}:`, errorMsg);
        
        // Return a cleaner message to the user
        let userMsg = errorMsg;
        if (errorMsg.includes('429')) {
            userMsg = 'AI quota reached. Please wait a minute before trying again.';
        } else if (errorMsg.includes('404')) {
            userMsg = 'AI model not found. Please check API configuration.';
        }
        
        res.status(500).json({ message: `AI failed: ${userMsg}` });
    }
});

module.exports = router;
