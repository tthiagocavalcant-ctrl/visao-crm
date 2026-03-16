import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tables } from '@/integrations/supabase/types';
import {
  Search, Filter, MessageSquarePlus, Phone, MoreVertical, Smile, Paperclip, Mic, Send,
  ArrowDown, X, FileText, Play, Image as ImageIcon, CheckCheck, Check as CheckIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type Conversation = Tables<'conversations'>;
type Message = Tables<'messages'>;

const ConversasPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const accountId = user?.account_id;

  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [pendingMediaUrl, setPendingMediaUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const whatsappConnected = true;

  // ── Fetch conversations ──
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('account_id', accountId!)
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!accountId,
  });

  // ── Fetch messages for active conversation ──
  const { data: activeMessages = [] } = useQuery({
    queryKey: ['messages', activeConversation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversation!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!activeConversation,
  });

  // ── Realtime subscription for new messages ──
  useEffect(() => {
    if (!accountId) return;
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `account_id=eq.${accountId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Refresh messages if it's the active conversation
          queryClient.invalidateQueries({ queryKey: ['messages', newMsg.conversation_id] });
          // Refresh conversations list to update last_message etc.
          queryClient.invalidateQueries({ queryKey: ['conversations', accountId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, queryClient]);

  // ── Send message mutation ──
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeConversation || !accountId || !user) throw new Error('Missing context');

      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: activeConversation,
        account_id: accountId,
        content,
        message_type: 'text',
        direction: 'outbound',
        status: 'sent',
        sent_by: user.id,
      });
      if (msgError) throw msgError;

      const { error: convError } = await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        })
        .eq('id', activeConversation);
      if (convError) throw convError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations', accountId] });
    },
    onError: () => {
      toast.error('Erro ao enviar mensagem');
    },
  });

  // ── Clear unread mutation ──
  const clearUnreadMutation = useMutation({
    mutationFn: async (convId: string) => {
      await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', convId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', accountId] });
    },
  });

  const activeConv = conversations.find(c => c.id === activeConversation);

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.contact_name.toLowerCase().includes(q) || c.contact_phone.includes(q));
    }
    if (filterTab === 'unread') list = list.filter(c => (c.unread_count ?? 0) > 0);
    return list;
  }, [conversations, searchQuery, filterTab]);

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 200);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!messageInput.trim() || !activeConversation) return;
    sendMessageMutation.mutate(messageInput.trim());
    setMessageInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectConversation = (id: string) => {
    setActiveConversation(id);
    const conv = conversations.find(c => c.id === id);
    if (conv && (conv.unread_count ?? 0) > 0) {
      clearUnreadMutation.mutate(id);
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDivider = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoje';
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-600',
      'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-pink-600',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    activeMessages.forEach(msg => {
      const msgDate = new Date(msg.created_at!).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msg.created_at!, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  }, [activeMessages]);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
    if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
    return <CheckIcon className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <div className="flex h-[calc(100vh-48px)] -m-6 overflow-hidden">
      {/* LEFT PANEL — Conversation List */}
      <div className="w-[340px] shrink-0 glass-sidebar flex flex-col border-r border-border">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Conversas</h2>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent">
              <Filter className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent">
              <MessageSquarePlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar ou começar uma conversa"
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex px-3 gap-1 pb-2">
          {(['all', 'unread', 'groups'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors relative ${
                filterTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'all' ? 'Todas' : tab === 'unread' ? 'Não lidas' : 'Grupos'}
              {tab === 'unread' && unreadTotal > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] rounded-full bg-success text-white font-bold">
                  {unreadTotal}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <MessageSquarePlus className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Nenhuma conversa ainda</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                As conversas aparecerão aqui automaticamente quando o WhatsApp estiver conectado
              </p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/50 ${
                  activeConversation === conv.id
                    ? 'bg-primary/10'
                    : (conv.unread_count ?? 0) > 0
                    ? 'bg-accent/5 hover:bg-accent/10'
                    : 'hover:bg-accent/5'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(conv.contact_name)} flex items-center justify-center text-white text-sm font-semibold`}>
                    {getInitials(conv.contact_name)}
                  </div>
                  {conv.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-background" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${(conv.unread_count ?? 0) > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                      {conv.contact_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                      {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      {conv.last_message}
                    </p>
                    {(conv.unread_count ?? 0) > 0 && (
                      <span className="ml-2 shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] rounded-full bg-success text-white font-bold">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col min-w-0">
        {!whatsappConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <Phone className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">WhatsApp não configurado</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Entre em contato com o suporte para ativar o WhatsApp na sua conta.
            </p>
          </div>
        ) : !activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquarePlus className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">WhatsApp CRM</h3>
            <p className="text-sm text-muted-foreground mb-4">Selecione uma conversa para começar</p>
            <div className="flex items-center gap-2 text-xs text-success">
              <div className="w-2 h-2 rounded-full bg-success" />
              Conectado
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-border glass-topbar shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full ${getAvatarColor(activeConv.contact_name)} flex items-center justify-center text-white text-xs font-semibold`}>
                    {getInitials(activeConv.contact_name)}
                  </div>
                  {activeConv.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-background" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{activeConv.contact_name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{activeConv.contact_phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent">
                  <Search className="w-4 h-4" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                    <DropdownMenuItem>Marcar como não lida</DropdownMenuItem>
                    <DropdownMenuItem>Arquivar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Bloquear</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages area */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-1 relative"
              style={{ backgroundImage: 'var(--chat-bg-pattern, none)' }}
            >
              {groupedMessages.map((group, gi) => (
                <div key={gi}>
                  <div className="flex items-center justify-center my-3">
                    <span className="text-[11px] text-muted-foreground bg-card px-3 py-1 rounded-full border border-border">
                      {formatDateDivider(group.date)}
                    </span>
                  </div>
                  {group.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex mb-1 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[65%] px-3 py-2 text-sm relative ${
                          msg.direction === 'outbound'
                            ? 'chat-bubble-sent rounded-tl-xl rounded-bl-xl rounded-br-xl rounded-tr-none'
                            : 'chat-bubble-received rounded-tr-xl rounded-br-xl rounded-bl-xl rounded-tl-none'
                        }`}
                      >
                        {msg.message_type === 'image' && (
                          <div className="mb-1">
                            <div className="w-48 h-32 bg-muted rounded flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                          </div>
                        )}
                        {msg.message_type === 'audio' && (
                          <div className="flex items-center gap-2 mb-1">
                            <button className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <Play className="w-4 h-4 text-primary" />
                            </button>
                            <div className="flex-1 h-1 bg-muted-foreground/20 rounded-full">
                              <div className="h-1 w-1/3 bg-primary rounded-full" />
                            </div>
                            <span className="text-[10px] text-muted-foreground">0:15</span>
                          </div>
                        )}
                        {msg.message_type === 'document' && (
                          <div className="flex items-center gap-2 p-2 bg-background/30 rounded mb-1">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="text-xs">documento.pdf</span>
                          </div>
                        )}
                        {msg.message_type === 'system' ? (
                          <div className="text-center text-[11px] text-muted-foreground italic">
                            {msg.content}
                          </div>
                        ) : (
                          <>
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] text-muted-foreground/70">{formatTime(msg.created_at!)}</span>
                              {msg.direction === 'outbound' && <StatusIcon status={msg.status ?? 'sent'} />}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />

              {showScrollBottom && (
                <button
                  onClick={scrollToBottom}
                  className="fixed bottom-24 right-8 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground z-10"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Message input */}
            <div className="h-[60px] flex items-center gap-2 px-4 border-t border-border glass-topbar shrink-0">
              <button className="w-9 h-9 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent shrink-0">
                <Smile className="w-5 h-5" />
              </button>
              <button className="w-9 h-9 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent shrink-0">
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem"
                className="flex-1 h-9 bg-input border border-border rounded px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              {messageInput.trim() ? (
                <button
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending}
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button className="w-9 h-9 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent shrink-0">
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConversasPage;
