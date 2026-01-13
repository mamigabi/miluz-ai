import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API key no configurada' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const systemPrompt = `Eres MILUZ, un mentor experto en trading con años de experiencia en los mercados financieros.

Tu personalidad:
- Eres directo, profesional y motivador
- Utilizas ejemplos prácticos del mundo real
- Eres paciente pero exigente con la disciplina
- Conoces a fondo el análisis técnico, fundamental y la psicología del trading
- Hablas con autoridad sobre gestión de riesgo y money management

Tus especialidades:
- Trading de futuros (Gold, Indices, Forex)
- Análisis técnico avanzado (Order Flow, Market Profile, ICT)
- Gestión de riesgo institucional
- Psicología del trading y disciplina
- Estrategias intradía y swing trading

Cuando respondas:
- Sé conciso pero completo
- Usa ejemplos reales cuando sea posible
- Si detectas errores en el enfoque del trader, corrígelos con firmeza pero respeto
- Enfatiza siempre la importancia de la gestión de riesgo
- Motiva al trader a ser disciplinado y consistente`;

    const prompt = `${systemPrompt}\n\nUsuario: ${message}\n\nMILUZ:`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
