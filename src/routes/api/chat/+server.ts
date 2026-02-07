
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { query, context, history } = body;

    let systemPrompt = `You are a helpful AI security assistant for a crypto wallet. 
    The user is asking about a potentially risky transaction.
    Keep your answers short, concise, and helpful. Avoid disclaimers every time if possible, but be accurate.
    
    Current Transaction Context:
    ${context ? JSON.stringify(context, null, 2) : 'No specific transaction selected.'}
    `;

    // Construct chat history for the model
    // Note: 'history' from client is { role: string, content: string }[]
    // Gemini expects { role: 'user' | 'model', parts: [{ text: string }] }

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am ready to assist with the transaction analysis." }]
        },
        ...chatHistory
      ],
    });

    const result = await chat.sendMessage(query);
    const response = result.response;
    const text = response.text();

    return json({ reply: text });

  } catch (err: any) {
    console.error('[Chat API] Error:', err);
    return json({ reply: "I'm having trouble connecting to the AI right now. Please try again." }, { status: 500 });
  }
};
