import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Conversation, Message } from '@/models/index';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    if (conversationId) {
      const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).limit(100).lean();
      return NextResponse.json({ success: true, data: messages });
    }
    const conversations = await Conversation.find({ 'participants.userId': session.id }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: conversations });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { conversationId, text } = await request.json();
    const message = await Message.create({ conversationId, senderId: session.id, senderRole: session.role, text });
    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: { text, senderId: session.id, createdAt: new Date() }, updatedAt: new Date() });
    return NextResponse.json({ success: true, data: message });
  } catch { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }); }
}
