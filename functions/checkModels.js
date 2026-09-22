const { Groq } = require('groq-sdk');
require('dotenv').config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
groq.models.list().then(res => {
  console.log(res.data.map(m => m.id).filter(id => id.includes('vision') || id.includes('qwen') || id.includes('llama')));
});
