import { useState, useEffect, useRef } from 'react';
import { Send, Search, Plus, X, Circle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

export function Messages() {
  const auth = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [query, setQuery] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [newConvEmail, setNewConvEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  const currentUserEmail = auth.userEmail || '';
  const currentUserName = auth.userName || auth.userEmail?.split('@')[0] || 'Utilisateur';

  useEffect(() => { 
    fetchConversations(); 
    fetchUsers();
  }, []);

  useEffect(() => { 
    if (selectedConv) {
      fetchMessages(selectedConv);
      markConversationAsRead(selectedConv);
      subscribeToMessages(selectedConv);
    }
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [selectedConv]);

  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  async function fetchUsers() {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role')
      .neq('email', currentUserEmail)
      .order('full_name', { ascending: true });
    if (data) setUsers(data);
  }

  async function fetchConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_one.eq.${currentUserEmail},participant_two.eq.${currentUserEmail}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    if (data) {
      // Fetch last message for each conversation
      const conversationsWithPreview = await Promise.all(
        data.map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, sender_email')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_email', currentUserEmail);

          return {
            ...conv,
            lastMessage: lastMsg,
            unreadCount: unreadCount || 0,
            otherParticipant: conv.participant_one === currentUserEmail ? conv.participant_two : conv.participant_one,
          };
        })
      );
      setConversations(conversationsWithPreview);
    }
  }

  async function fetchMessages(convId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    if (data) setMessages(data);
  }

  function subscribeToMessages(convId: string) {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = supabase
      .channel(`messages:${convId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        // Mark as read if we're viewing this conversation
        if (payload.new.sender_email !== currentUserEmail) {
          markAsRead(payload.new.id);
        }
      })
      .subscribe();
  }

  async function markAsRead(messageId: string) {
    await supabase.from('messages').update({ read: true }).eq('id', messageId);
  }

  async function markConversationAsRead(convId: string) {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', convId)
      .eq('read', false)
      .neq('sender_email', currentUserEmail);

    // Refresh conversations to update unread counts
    fetchConversations();
  }

  async function handleSend() {
    if (!newMessage.trim() || !selectedConv) return;

    const { error } = await supabase.from('messages').insert([{
      conversation_id: selectedConv,
      sender_email: currentUserEmail,
      sender_name: currentUserName,
      content: newMessage.trim(),
      read: false,
    }]);

    if (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
      return;
    }

    // Update conversation updated_at
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', selectedConv);

    setNewMessage('');
    fetchMessages(selectedConv);
    fetchConversations();
  }

  async function handleNewConversation() {
    if (!newConvEmail) return;

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_one.eq.${currentUserEmail},participant_two.eq.${newConvEmail}),and(participant_one.eq.${newConvEmail},participant_two.eq.${currentUserEmail})`)
      .maybeSingle();

    if (existing) {
      setSelectedConv(existing.id);
      setShowNew(false);
      setNewConvEmail('');
      return;
    }

    const { data, error } = await supabase.from('conversations').insert([{
      participant_one: currentUserEmail,
      participant_two: newConvEmail,
    }]).select();

    if (error) {
      console.error('Error creating conversation:', error);
      alert('Erreur lors de la création de la conversation');
      return;
    }

    if (data && data[0]) {
      setSelectedConv(data[0].id);
      setShowNew(false);
      setNewConvEmail('');
      fetchConversations();
    }
  }

  const filteredUsers = users.filter(u => 
    !userQuery || 
    u.full_name?.toLowerCase().includes(userQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(userQuery.toLowerCase())
  );

  const filteredConversations = conversations.filter(c =>
    !query || c.otherParticipant?.toLowerCase().includes(query.toLowerCase())
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
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              Aucune conversation.<br />
              <button onClick={() => setShowNew(true)} className="text-[#007FFF] mt-1 hover:underline">Démarrer une conversation</button>
            </div>
          ) : filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConv(conv.id)}
              className={`p-4 cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedConv === conv.id ? 'bg-blue-50 border-l-4 border-l-[#007FFF]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-sm font-bold shrink-0 relative">
                  {conv.otherParticipant?.substring(0, 2).toUpperCase()}
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-[#0a2540] truncate block">{conv.otherParticipant}</span>
                  {conv.lastMessage ? (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.lastMessage.sender_email === currentUserEmail ? 'Vous: ' : ''}
                      {conv.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">Nouvelle conversation</p>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <Circle className="w-2 h-2 text-red-500 fill-red-500 shrink-0" />
                )}
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
                {selectedConvData.otherParticipant?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[#0a2540] text-sm">{selectedConvData.otherParticipant}</p>
                <p className="text-xs text-emerald-500">En ligne</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F6F9FC]">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-8">Aucun message. Démarrez la conversation!</div>
              ) : messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.sender_email === currentUserEmail ? 'flex-row-reverse' : ''}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-xl text-sm shadow-sm ${
                    msg.sender_email === currentUserEmail
                      ? 'bg-[#007FFF] text-white rounded-tr-none'
                      : 'bg-white text-gray-800 rounded-tl-none'
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_email === currentUserEmail ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender_email === currentUserEmail && (
                        <span className="ml-1">{msg.read ? '✓✓' : '✓'}</span>
                      )}
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0a2540]">Nouvelle conversation</h3>
              <button onClick={() => setShowNew(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center bg-[#F6F9FC] rounded-lg px-3 border border-gray-200">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  className="flex-1 bg-transparent py-2 text-sm outline-none"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun utilisateur trouvé</p>
                ) : filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setNewConvEmail(user.email)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${newConvEmail === user.email ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#0a2540] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {user.full_name?.substring(0, 2).toUpperCase() || user.email?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0a2540] truncate">{user.full_name || user.email}</p>
                      <p className="text-xs text-gray-400">{user.email} • {user.role}</p>
                    </div>
                    {newConvEmail === user.email && (
                      <div className="w-4 h-4 rounded-full bg-[#007FFF] flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Ou saisir un email manuellement:</p>
                <input
                  type="email"
                  placeholder="email@exemple.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#007FFF]"
                  value={newConvEmail}
                  onChange={(e) => setNewConvEmail(e.target.value)}
                />
              </div>

              <button 
                onClick={handleNewConversation} 
                disabled={!newConvEmail}
                className="w-full py-2.5 bg-[#0a2540] text-white rounded-lg font-semibold hover:bg-[#0d2f4f] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Démarrer la conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}