require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testAllModels() {
    console.log('Testing Quota on Available Models...\n');
    
    // Extracted from earlier /models call
    const models = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash-001',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemma-3-4b-it'
    ];

    for (const m of models) {
        process.stdout.write(`Testing ${m.padEnd(25)} `);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent('Hi');
            console.log(`✅ SUCCESS! Response: "${result.response.text().trim()}"`);
        } catch (err) {
            let msg = err.message.split('\n')[0];
            if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
                console.log(`❌ Quota Reached`);
            } else if (msg.includes('404')) {
                console.log(`❌ Not Found`);
            } else {
                console.log(`❌ Error: ${msg}`);
            }
        }
    }
}

testAllModels();
