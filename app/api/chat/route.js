import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { NextResponse } from 'next/server';

/**
 * Reads an SSE (Server-Sent Events) stream and assembles all content chunks
 * into a single string. Skips metadata events, collects data chunks.
 * Contract: https://medical-rag-chatbot-fastapi.onrender.com/docs
 */
async function readSSEStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep last incomplete line

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content' || parsed.content) {
            fullText += parsed.content || parsed.text || '';
          } else if (typeof parsed === 'string') {
            fullText += parsed;
          }
        } catch {
          // Not JSON — treat as raw text chunk
          if (data && data !== '[DONE]') fullText += data;
        }
      }
    }
  }

  // Flush remaining buffer
  if (buffer.startsWith('data:')) {
    const data = buffer.slice(5).trim();
    if (data && data !== '[DONE]') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.content) fullText += parsed.content;
      } catch {
        fullText += data;
      }
    }
  }

  return fullText.trim();
}

// ─── POST /api/chat ────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_Id, message, role } = body;
    const session_id =
      body.session_id ||
      `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    if (!user_Id || !message || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: user_Id, message, role' },
        { status: 400 }
      );
    }

    if (!['patient', 'student'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be patient or student.' },
        { status: 400 }
      );
    }

    // ✅ API contract: POST /api/chat → { user_id, message, role }
    // Returns SSE stream
    const aiResponse = await fetch(process.env.AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user_Id, // API uses snake_case user_id
        message,
        role,
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      console.error('AI API error body:', errBody);
      throw new Error(`AI API responded with status: ${aiResponse.status}`);
    }

    // Read SSE stream or plain JSON fallback
    const contentType = aiResponse.headers.get('content-type') || '';
    let aiMessage = '';

    if (contentType.includes('text/event-stream')) {
      aiMessage = await readSSEStream(aiResponse);
    } else {
      const aiData = await aiResponse.json();
      aiMessage =
        aiData.answer ||
        aiData.response ||
        aiData.message ||
        aiData.content ||
        (typeof aiData === 'string' ? aiData : 'No response received from AI.');
    }

    if (!aiMessage) aiMessage = 'No response received from AI.';

    // ── Save to MongoDB ──
    const sessionTitle =
      message.length > 50 ? message.slice(0, 48) + '…' : message;
    let chatId = null;
    try {
      await dbConnect();
      const existingMsg = await Chat.findOne({ user_Id, session_id }).lean();
      const chatRecord = await Chat.create({
        user_Id,
        session_id,
        session_title: existingMsg ? existingMsg.session_title : sessionTitle,
        role,
        user_message: message,
        ai_response: aiMessage,
      });
      chatId = chatRecord._id;
    } catch (dbError) {
      console.error('MongoDB save failed (chat still returned):', dbError.message);
    }

    return NextResponse.json({ user_Id, message: aiMessage, chat_id: chatId });
  } catch (error) {
    console.error('Chat API POST error:', error?.message);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── GET /api/chat ─────────────────────────────────────────────────────────

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_Id = searchParams.get('user_Id');
    const session_id = searchParams.get('session_id');

    if (!user_Id) {
      return NextResponse.json({ error: 'user_Id is required' }, { status: 400 });
    }

    await dbConnect();

    // Return messages for a specific session
    if (session_id) {
      const chats = await Chat.find({ user_Id, session_id })
        .sort({ createdAt: 1 })
        .lean();
      return NextResponse.json({ chats });
    }

    // Return all chats + grouped sessions list
    const chats = await Chat.find({ user_Id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Group into sessions — skip docs without a valid session_id
    const sessionMap = new Map();
    for (const chat of [...chats].reverse()) {
      const sid = chat.session_id;
      if (!sid || sid.startsWith('sess_legacy_')) continue;

      if (!sessionMap.has(sid)) {
        sessionMap.set(sid, {
          session_id: sid,
          session_title: chat.session_title || chat.user_message.slice(0, 50),
          createdAt: chat.createdAt,
          lastUpdated: chat.createdAt,
        });
      } else {
        sessionMap.get(sid).lastUpdated = chat.createdAt;
      }
    }

    const sessions = [...sessionMap.values()].sort(
      (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
    );

    return NextResponse.json({ chats, sessions });
  } catch (error) {
    console.error('Fetch chats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/chat ──────────────────────────────────────────────────────

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_Id = searchParams.get('user_Id');
    const session_id = searchParams.get('session_id');

    if (!user_Id) {
      return NextResponse.json({ error: 'user_Id is required' }, { status: 400 });
    }

    await dbConnect();

    if (session_id) {
      await Chat.deleteMany({ user_Id, session_id });
      return NextResponse.json({ message: 'Session deleted successfully.' });
    }

    await Chat.deleteMany({ user_Id });
    return NextResponse.json({ message: 'Chat history cleared successfully.' });
  } catch (error) {
    console.error('Delete chats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
