import { useState } from 'react';
import { Search, Send, Paperclip, Phone, FileText, User, CheckCheck } from 'lucide-react';
import { conversations, messages as mockMessages } from '@/data/mockData';

export function Messages() {
  const [activeConv, setActiveConv] = useState(conversations[0].id);
  const [newMessage, setNewMessage] = useState('');
  const [msgs, setMsgs] = useState(mockMessages);
  const [filter, setFilter] = useState<'all' | 'admin' | 'prime' | 'subcontractor'>('all');

  const filteredConvs = conversations.filter((c) => filter === 'all' || c.type === filter);
  const activeConversation = conversations.find((c) => c.id === activeConv);
  const thread = msgs.filter((m) => m.conversationId === activeConv);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: `msg-${Date.now()}`,
      conversationId: activeConv,
      senderId: 'user',
      receiverId: activeConversation?.participantName || '',
      content: newMessage,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      readStatus: 'read' as const,
    };
    setMsgs([...msgs, msg]);
    setNewMessage('');
  };

  const quickReplies = [
    "Bonjour, je suis intéressé par votre offre.",
    "Pouvez-vous préciser les conditions ?",
    "Merci, je reviens vers vous prochainement.",
  ];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 -mx-6 -mt-6 px-6 pt-6">
      {/* Left - Conversation List */}
      <div className="lg:w-80 shrink-0 bg-white rounded-xl card-shadow flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center bg-[#F6F9FC] rounded-lg px-3 border border-gray-200 mb-3">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input type="text" placeholder="Rechercher..." className="flex-1 bg-transparent py-2 text-sm outline-none" />
          </div>
          <div className="flex gap-1">
            {(['all', 'admin', 'prime', 'subcontractor'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded text-[10px] font-medium uppercase transition-colors ${
                  filter === f ? 'bg-[#0a2540] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'admin' ? 'ARSP' : f === 'prime' ? 'Donneurs' : 'Sous-traitants'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConv(c.id)}
              className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${
                activeConv === c.id ? 'bg-blue-50 border-l-2 border-[#007FFF]' : 'hover:bg-gray-50 border-l-2 border-transparent'
              }`}
            >
              <div className="relative shrink-0">
                <img src={c.participantAvatar || '/arsp-logo.jpg'} alt="" className="w-10 h-10 rounded-full object-cover" />
                {c.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">{c.unreadCount}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0a2540] truncate">{c.participantName}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{c.timestamp.split(' ')[0]}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Center - Thread */}
      <div className="flex-1 bg-white rounded-xl card-shadow flex flex-col overflow-hidden">
        {activeConversation && (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={activeConversation.participantAvatar || '/arsp-logo.jpg'} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h3 className="font-semibold text-[#0a2540] text-sm">{activeConversation.participantName}</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-xs text-gray-500">En ligne</span>
                  </div>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Phone className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {thread.map((msg) => {
                const isMe = msg.senderId === 'user';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-[#0a2540] text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-700 rounded-bl-sm'
                    }`}>
                      <p>{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                        <span className="text-[10px] opacity-70">{msg.timestamp.split(' ')[1]}</span>
                        {isMe && <CheckCheck className="w-3 h-3 opacity-70" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Quick replies */}
              <div className="flex flex-wrap gap-2 pt-2">
                {quickReplies.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => { setNewMessage(qr); }}
                    className="px-3 py-1.5 bg-blue-50 text-[#007FFF] rounded-full text-xs hover:bg-blue-100 transition-colors"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                </button>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Écrivez un message..."
                  className="flex-1 px-3 py-2 bg-[#F6F9FC] rounded-lg text-sm outline-none resize-none min-h-[40px] max-h-[100px]"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-[#007FFF] text-white rounded-lg hover:bg-[#0066CC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right - Context Panel */}
      <div className="hidden xl:block w-64 shrink-0 bg-white rounded-xl card-shadow p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Contexte</h4>
        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-[#0a2540] mb-1">Fichiers partagés</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-600">cahier_des_charges.pdf</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-600">offre_technique_v2.docx</span>
              </div>
            </div>
          </div>
          <div>
            <h5 className="text-sm font-medium text-[#0a2540] mb-1">Profil</h5>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">Minerais & Logistique SPRL</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">Mining • Lubumbashi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
