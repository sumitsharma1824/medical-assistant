import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { NextResponse } from 'next/server';

/**
 * Reads an SSE (Server-Sent Events) stream and assembles all content chunks
 * into a single string. Skips metadata events, collects data chunks.
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
    // Keep the last incomplete line in the buffer
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          // Collect text content — ignore metadata events
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

  // Handle any remaining buffer content
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_Id, message, role } = body;

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

    // ✅ Exact contract from: https://medical-rag-ai.onrender.com/docs
    // POST /api/chat → { user_id, message, role }
    const aiResponse = await fetch(process.env.AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user_Id,   // API uses snake_case user_id
        message: message,
        role: role,         // "patient" or "student" passed as-is
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      console.error('AI API error body:', errBody);
      throw new Error(`AI API responded with status: ${aiResponse.status}`);
    }

    // The API returns SSE (Server-Sent Events) — read the full stream
    const contentType = aiResponse.headers.get('content-type') || '';
    let aiMessage = '';

    if (contentType.includes('text/event-stream')) {
      // SSE streaming response
      aiMessage = await readSSEStream(aiResponse);
    } else {
      // Plain JSON fallback
      const aiData = await aiResponse.json();
      aiMessage =
        aiData.answer ||
        aiData.response ||
        aiData.message ||
        aiData.content ||
        (typeof aiData === 'string' ? aiData : 'No response received from AI.');
    }

    if (!aiMessage) aiMessage = 'No response received from AI.';

    // Save to MongoDB (non-blocking — chat still works if MongoDB is not configured)
    let chatId = null;
    try {
      await dbConnect();
      const chatRecord = await Chat.create({
        user_Id,
        role,
        user_message: message,
        ai_response: aiMessage,
      });
      chatId = chatRecord._id;
    } catch (dbError) {
      console.error('MongoDB save failed (chat still returned):', dbError.message);
      // Don't throw — still return the AI response to the user
    }

    return NextResponse.json({
      user_Id,
      message: aiMessage,
      chat_id: chatId,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_Id = searchParams.get('user_Id');

    if (!user_Id) {
      return NextResponse.json({ error: 'user_Id is required' }, { status: 400 });
    }

    await dbConnect();
    const chats = await Chat.find({ user_Id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Fetch chats error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_Id = searchParams.get('user_Id');

    if (!user_Id) {
      return NextResponse.json({ error: 'user_Id is required' }, { status: 400 });
    }

    await dbConnect();
    await Chat.deleteMany({ user_Id });

    return NextResponse.json({ message: 'Chat history cleared successfully.' });
  } catch (error) {
    console.error('Delete chats error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
