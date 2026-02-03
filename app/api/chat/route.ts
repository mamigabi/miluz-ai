import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// IDENTITY: MILUZ Trading Mentor (Blacksheep Philosophy)
const SYSTEM_PROMPT = `Eres MILUZ, un Mentor de Trading especializado en la estrategia BLACKSHEEP. 
Tu objetivo es operar en CONTRA del rebaño retail, detectando liquidez y explotando patrones que otros ignoran.

CARACTERÍSTICAS:
- Razonamiento profundo antes de actuar (ReAct Pattern)
- Acceso a herramientas: getBinanceData, analyzeChartSentiment, searchTrendingTopics
- Perfil: Disruptivo, directo, sin miedo a contrarian el consensus
- Objetivo final: Rentabilidad consistente operando en contra del movimiento retail

METODOLOGÍA:
1. RAZONA: "Qué está haciendo el rebaño?"
2. PLANEA: "Cómo puedo posicionarme en lo opuesto?"
3. OBSERVA: "Qué datos confirman mi hipótesis?"`;

// Tool declarations for Function Calling
const tools = {
  functionDeclarations: [
    {
      name: 'getBinanceData',
      description: 'Obtiene datos de precio y volumen de Binance para un par de trading',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'El par a analizar (ej: BTCUSDT)'
          }
        },
        required: ['symbol']
      }
    },
    {
      name: 'analyzeChartSentiment',
      description: 'Analiza el sentimiento general del mercado basado en patrones técnicos',
      parameters: {
        type: 'object',
        properties: {
          timeframe: {
            type: 'string',
            description: '1h, 4h, 1d, etc.'
          }
        },
        required: ['timeframe']
      }
    },
    {
      name: 'searchTrendingTopics',
      description: 'Busca los temas más comentados en Twitter/X para detectar movimientos retail',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'crypto, stocks, forex, etc.'
          }
        },
        required: ['category']
      }
    }
  ]
};

// Simulated tool execution (in production, connect to real APIs)
async function executeTool(toolName: string, toolInput: Record<string, unknown>) {
  switch (toolName) {
    case 'getBinanceData':
      return {
        symbol: toolInput.symbol,
        price: 43250.50,
        volume24h: 28500000000,
        change24h: 2.5,
        rsi: 65,
        macd: 'bullish'
      };
    case 'analyzeChartSentiment':
      return {
        timeframe: toolInput.timeframe,
        sentiment: 'overbought',
        support: 42800,
        resistance: 44000,
        liquidity_zones: ['42500-42800', '44000-44500']
      };
    case 'searchTrendingTopics':
      return {
        trending: [
          'Altseason incoming',
          'Bitcoin breakout imminent',
          'ETF inflows recovering'
        ],
        retailSentiment: 'FOMO buying',
        counterSignal: 'Sell when retail buys'
      };
    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API key no configurada' },
        { status: 500 }
      );
    }

    // Get or create agent memory in Supabase
    if (userId) {
      const { data: memory } = await supabase
        .from('agent_memory')
        .select('*')
        .eq('user_id', userId)
        .limit(10);

      // Append previous context to system prompt
      console.log('Agent memory loaded:', memory?.length || 0);
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: SYSTEM_PROMPT,
      tools: [tools] as any
    } as any);

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    });

    // Send user message and let the model decide if it needs tools
    const result = await chat.sendMessage(messages[messages.length - 1].content);

    // Process any tool calls
    const response = result.response;
    let finalResponse = response.text();

    // Check if model called any tools
    if ((response as any).functionCalls()) {
      const calls = (response as any).functionCalls();
      let toolResults = [];

      for (const call of calls) {
        const toolResult = await executeTool(call.name, call.args);
        toolResults.push({
          thought: `Tool called: ${call.name}`,
          action: `Executing ${call.name} with args: ${JSON.stringify(call.args)}`,
          observation: toolResult
        });
      }

      // Save to agent memory
      if (userId) {
        await supabase.from('agent_memory').insert({
          user_id: userId,
          thought: `User asked: ${messages[messages.length - 1].content}`,
          action: `Tool calls: ${calls.map(c => c.name).join(', ')}`,
          observation: toolResults,
          created_at: new Date().toISOString()
        });
      }

      // Continue conversation with tool results
      const followUp = await chat.sendMessage(
        `Based on these tool results: ${JSON.stringify(toolResults)}, provide your analysis.`
      );
      finalResponse = followUp.response.text();
    }

    return NextResponse.json({
      response: finalResponse,
      model: 'gemini-2.0-flash',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { error: 'Error processing message' },
      { status: 500 }
    );
  }
}
