'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle } from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { if (selectedConv) fetchMessages(selectedConv._id); }, [selectedConv]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function fetchConversations() {
    const res = await fetch('/api/chat');
    if (res.ok) { const data = await res.json(); setConversations(data.data || []); }
  }

  async function fetchMessages(convId: string) {
    const res = await fetch(`/api/chat?conversationId=${convId}`);
    if (res.ok) { const data = await res.json(); setMessages(data.data || []); }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedConv) return;
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: selectedConv._id, text: newMessage }),
    });
    if (res.ok) { setMessages([...messages, { text: newMessage, senderId: user?.id, createdAt: new Date() }]); setNewMessage(''); }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-80 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b"><h2 className="font-bold text-lg">Messages</h2></div>
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500"><MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>No conversations yet</p></div>
        ) : conversations.map(conv => (
          <button key={conv._id} onClick={() => setSelectedConv(conv)} className={`w-full p-4 text-left border-b hover:bg-gray-50 ${selectedConv?._id === conv._id ? 'bg-green-50' : ''}`}>
            <p className="font-medium">{conv.participants?.find((p: any) => p.userId !== user?.id)?.name || 'Chat'}</p>
            <p className="text-sm text-gray-500 truncate">{conv.lastMessage?.text || 'No messages'}</p>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.senderId === user?.id ? 'bg-green-600 text-white' : 'bg-white border'}`}>{msg.text}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-white flex space-x-2">
              <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." onKeyPress={e => e.key === 'Enter' && sendMessage()} />
              <Button onClick={sendMessage}><Send className="w-4 h-4" /></Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500"><p>Select a conversation</p></div>
        )}
      </div>
    </div>
  );
}
