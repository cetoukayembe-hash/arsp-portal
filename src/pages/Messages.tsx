import { useState, useEffect, useRef } from 'react';
import { Send, Search, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Messages() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newConv, setNewConv] = useState({ participant_two: '', participant_one: 'moi@arsp.cd' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { if (selectedConv) fetchMessages(selectedConv); }, [selectedConv]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function fetchConversations() {
    const { data } = await supabase.from('conversations').select('*').order('created_at', { ascending: false });
    if (data) setConversations(data);
  }

  async function fetchMessages(convId: string) {
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  }

  async function handleSend() {
    if (!newMessage.trim() || !selectedConv) return;
    await supabase.from('messages').insert([{
      conversation_id: selectedConv,
      sender_email: 'moi@arsp.cd',
      sender_name: 'Moi',
      content: newMessage,
    }]);
    setNewMessage('');
    fetchMessages(selectedConv);
  }

  async function handleNewConversation() {
    if (!newConv.participant_two) return;
    const { data } = await supabase.from('conversations').insert([{
      participant_one: newConv.participant_one,
      participant_two: newConv.participant_two,
    }]).select();
    if (data && data[0]) {
      setSelectedConv(data[0].id);
      setShowNew(false);
      fetchConversations();
    }
  }

  const filtered = conversations.filter(c =>
    !query || c.participant_two?.toLowerCase().includes(query.toLowerCase())
  );

  const selectedConvData = conversations.find(c => c.id === selectedConv);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl card-shadow overflow-hidden">

      {/* Conversation List */}
      <div className="w-80 border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#0a2540]">Messagerie</h2>
            <button
              onClick={() => setShowNew(true)}
              className="p-1.5 bg-[#007FFF] text-white rounded-lg hover:bg-[#0066CC]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center bg-[#F6F9FC] rounded-lg px-3 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="flex-1 bg-transparent py-2 text-sm outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              Aucune conversation.<br />
              <button onClick={() => setShowNew(true)} className="text-[#007FFF] mt-1 hover:underline">Démarrer une conversation</button>
            </div>
          ) : filtered.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConv(conv.id)}
              className={`p-4 cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedConv === conv.id ? 'bg-blue-50 border-l-4 border-l-[#007FFF]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {conv.participant_two?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-[#0a2540] truncate block">{conv.participant_two}</span>
                  <p className="text-xs text-gray-400 mt-0.5">Cliquer pour voir les messages</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col">
        {selectedConvData ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-sm font-bold">
                {selectedConvData.participant_two?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[#0a2540] text-sm">{selectedConvData.participant_two}</p>
                <p className="text-xs text-emerald-500">En ligne</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F6F9FC]">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-8">Aucun message. Démarrez la conversation!</div>
              ) : messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.sender_email === 'moi@arsp.cd' ? 'flex-row-reverse' : ''}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-xl text-sm shadow-sm ${
                    msg.sender_email === 'moi@arsp.cd'
                      ? 'bg-[#007FFF] text-white rounded-tr-none'
                      : 'bg-white text-gray-800 rounded-tl-none'
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_email === 'moi@arsp.cd' ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-2">
              <input
                type="text"
                placeholder="Écrire un message..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend} className="p-2 bg-[#007FFF] text-white rounded-lg hover:bg-[#0066CC]">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Sélectionnez une conversation</p>
              <p className="text-gray-400 text-sm mt-1">ou démarrez-en une nouvelle</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0a2540]">Nouvelle conversation</h3>
              <button onClick={() => setShowNew(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email du destinataire *"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                value={newConv.participant_two}
                onChange={(e) => setNewConv({...newConv, participant_two: e.target.value})}
              />
              <button onClick={handleNewConversation} className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f]">
                Démarrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}