import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, User, Bot, Plus, History, X, MessageSquare, ArrowUp, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useTrades } from '@/hooks/useTrades';
import { useAccount } from '@/hooks/useAccount';
import { useAIConversations, AIMessage } from '@/hooks/useAIConversations';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAIChatStore } from '@/store/aiChatStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
const PRESET_QUESTIONS = ["What's my biggest weakness?", "How can I improve my win rate?", "Best risk management strategies?", "How to manage my emotions?"];

// Custom brain/AI icon - thin stroke style
const AIIcon = ({
  className
}: {
  className?: string;
}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
    <path d="M6 18a4 4 0 0 1-1.967-.516" />
    <path d="M19.967 17.484A4 4 0 0 1 18 18" />
  </svg>;

// Animated wave icon for when AI is typing
const AnimatedWaveIcon = ({
  className,
  isAnimating
}: {
  className?: string;
  isAnimating: boolean;
}) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="8" x2="4" y2="16" className={cn(isAnimating && "animate-wave-1")} style={{
    transformOrigin: '4px 12px'
  }} />
    <line x1="8" y1="6" x2="8" y2="18" className={cn(isAnimating && "animate-wave-2")} style={{
    transformOrigin: '8px 12px'
  }} />
    <line x1="12" y1="4" x2="12" y2="20" className={cn(isAnimating && "animate-wave-3")} style={{
    transformOrigin: '12px 12px'
  }} />
    <line x1="16" y1="6" x2="16" y2="18" className={cn(isAnimating && "animate-wave-4")} style={{
    transformOrigin: '16px 12px'
  }} />
    <line x1="20" y1="8" x2="20" y2="16" className={cn(isAnimating && "animate-wave-5")} style={{
    transformOrigin: '20px 12px'
  }} />
  </svg>;
export default function PerformanceCoach() {
  const {
    trades
  } = useTrades();
  const {
    activeAccount
  } = useAccount();
  // Use separate selectors to avoid object reference issues
  const storedConversationId = useAIChatStore(state => state.currentConversationId);
  const setStoredConversationId = useAIChatStore(state => state.setCurrentConversationId);
  const {
    conversations,
    currentConversationId,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    createConversation,
    addMessage,
    updateConversationTitle,
    deleteConversation,
    selectConversation,
    startNewChat,
    getAllMessagesForContext,
    setMessages
  } = useAIConversations();
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<{
    url: string;
    file: File;
  }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTrades = trades.length > 0;
  const hasInitializedRef = useRef(false);

  // Restore conversation from store on mount (only once)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (!isLoadingConversations && conversations.length > 0 && storedConversationId) {
      const conversationExists = conversations.some(c => c.id === storedConversationId);
      if (conversationExists && !currentConversationId) {
        hasInitializedRef.current = true;
        selectConversation(storedConversationId);
      }
    }
  }, [isLoadingConversations, conversations, storedConversationId, currentConversationId, selectConversation]);

  // Sync current conversation ID to store (only when it actually changes to a different value)
  useEffect(() => {
    if (currentConversationId && currentConversationId !== storedConversationId) {
      setStoredConversationId(currentConversationId);
    }
  }, [currentConversationId, storedConversationId, setStoredConversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [userInput]);
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: {
      url: string;
      file: File;
    }[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        newImages.push({
          url: URL.createObjectURL(file),
          file
        });
      }
    });
    setPendingImages(prev => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const removeImage = (index: number) => {
    setPendingImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].url);
      newImages.splice(index, 1);
      return newImages;
    });
  };
  const handleSendMessage = async (question?: string) => {
    const messageText = question || userInput.trim();
    if (!messageText && pendingImages.length === 0 || isLoading) return;
    const imagesToSend = [...pendingImages];
    setUserInput('');
    setPendingImages([]);
    setIsLoading(true);
    try {
      // Get or create conversation
      let conversationId = currentConversationId;
      if (!conversationId) {
        conversationId = await createConversation(messageText || 'Image analysis');
        if (!conversationId) throw new Error('Failed to create conversation');
      } else if (messages.length === 0) {
        await updateConversationTitle(conversationId, messageText || 'Image analysis');
      }

      // Build message content with images
      let fullMessage = messageText;
      if (imagesToSend.length > 0) {
        fullMessage = `${messageText}\n\n[${imagesToSend.length} image(s) attached for analysis]`;
      }

      // Add user message
      const userMessage = await addMessage(conversationId, 'user', fullMessage);
      if (!userMessage) throw new Error('Failed to save message');

      // Get historical context for personalization
      const historicalMessages = await getAllMessagesForContext();

      // Build conversation history including current messages
      const allMessages = [...messages, userMessage];
      const conversationHistory = allMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Add historical context summary if available
      const historicalContext = historicalMessages.filter(m => m.conversationId !== conversationId).slice(0, 20).map(m => `[${m.role}]: ${m.content}`).join('\n');

      // Prepare question with image context
      let questionWithContext = messageText;
      if (imagesToSend.length > 0) {
        questionWithContext = `${messageText}\n\nNote: The user has attached ${imagesToSend.length} image(s) (likely trading charts or screenshots). Please acknowledge and provide relevant analysis based on their question.`;
      }
      const {
        data,
        error: fnError
      } = await supabase.functions.invoke('analyze-trades', {
        body: {
          timeFilter: 'all',
          customQuestion: questionWithContext,
          adviceMode: hasTrades ? 'personalized' : 'general',
          conversationHistory,
          historicalContext: historicalContext || undefined,
          accountId: activeAccount?.id
        }
      });
      if (fnError) throw new Error(fnError.message);
      const responseContent = data?.insights || data?.error || 'No response available.';
      await addMessage(conversationId, 'assistant', responseContent);
    } catch (err) {
      console.error('Error:', err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        conversationId: currentConversationId || '',
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date()
      }]);
    } finally {
      setIsLoading(false);
      // Cleanup image URLs
      imagesToSend.forEach(img => URL.revokeObjectURL(img.url));
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const handleSelectConversation = async (conversationId: string) => {
    await selectConversation(conversationId);
    setShowHistory(false);
  };
  const handleNewChat = () => {
    startNewChat();
    setStoredConversationId(null);
    setShowHistory(false);
  };
  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    setDeleteConfirmId(null);
  };
  const [visibleCount, setVisibleCount] = useState(5);
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5);
  };

  // History popup modal
  const HistoryModal = () => <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200" onClick={() => setShowHistory(false)} />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-[15%] z-50 mx-auto max-w-md animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <h2 className="font-semibold text-foreground">Recent Chats</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="h-8 w-8 rounded-lg hover:bg-muted">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Conversations List */}
          <ScrollArea className="max-h-[50vh]">
            <div className="p-2">
              {isLoadingConversations ? <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Loading...</p>
                </div> : conversations.length === 0 ? <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No conversations yet</p>
                  <p className="text-xs text-muted-foreground">
                    Start a new chat to begin
                  </p>
                </div> : <div className="space-y-1">
                  {conversations.slice(0, visibleCount).map(conv => <div key={conv.id} className={cn("group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all", currentConversationId === conv.id ? "bg-primary/10" : "hover:bg-muted/50")} onClick={() => handleSelectConversation(conv.id)}>
                      <div className={cn("shrink-0 w-9 h-9 rounded-full flex items-center justify-center", currentConversationId === conv.id ? "bg-primary/20" : "bg-muted")}>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {conv.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(conv.updatedAt, 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {currentConversationId === conv.id && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                            Active
                          </span>}
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => {
                    e.stopPropagation();
                    setDeleteConfirmId(conv.id);
                  }}>
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>)}
                </div>}
            </div>
          </ScrollArea>

          {/* Footer with Load More */}
          {conversations.length > visibleCount && <div className="border-t border-border/50 p-3">
              <button onClick={handleLoadMore} className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium py-2 transition-colors">
                Load more
              </button>
            </div>}
        </div>
      </div>
    </>;
  return <div className="flex h-[calc(100vh-4rem)] md:h-screen">
      {/* History Modal */}
      {showHistory && <HistoryModal />}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="shrink-0 px-4 pt-4 pb-3 md:px-6 border-b border-border bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              
              <div>
                <h1 className="text-lg font-semibold text-foreground">AI Coach</h1>
                <p className="text-xs text-muted-foreground">Your trading assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleNewChat} className="h-9 w-9" title="New Chat">
                <Plus className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)} className={cn("h-9 w-9", showHistory && "bg-muted")} title="Chat History">
                <History className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 space-y-4">
          {isLoadingMessages ? <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div> : messages.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-center px-4">
              
              <h2 className="text-xl font-semibold mb-2 text-foreground">How can I help?</h2>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Ask me anything about trading or your trading performance
              </p>
              
              {/* Preset Questions */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {PRESET_QUESTIONS.map((question, i) => <button key={i} onClick={() => handleSendMessage(question)} disabled={isLoading} className="text-left text-xs p-3 rounded-xl bg-card/50 border border-border/50 hover:bg-muted/50 transition-colors disabled:opacity-50 text-foreground">
                    {question}
                  </button>)}
              </div>
            </div> : <>
              {messages.map(message => <div key={message.id} className={cn("flex gap-3 max-w-[85%]", message.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                  <div className={cn("shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border border-border/50", message.role === 'user' ? "bg-foreground/10" : "bg-foreground/10")}>
                    {message.role === 'user' ? <User className="h-4 w-4 text-foreground" /> : <Bot className="h-4 w-4 text-foreground" />}
                  </div>
                  <div className={cn("rounded-2xl px-4 py-3", message.role === 'user' ? "bg-foreground text-background rounded-tr-sm" : "bg-card border border-border rounded-tl-sm")}>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>)}
              
              {isLoading && <div className="flex gap-3 max-w-[85%]">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center border border-border/50">
                    <Bot className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-foreground/40 animate-chat-bounce-1" />
                    <div className="w-2 h-2 rounded-full bg-foreground/40 animate-chat-bounce-2" />
                    <div className="w-2 h-2 rounded-full bg-foreground/40 animate-chat-bounce-3" />
                  </div>
                </div>}
              <div ref={messagesEndRef} />
            </>}
        </div>

        {/* Input Area */}
        <div className="shrink-0 px-4 pb-4 md:px-6 md:pb-6 flex justify-center">
          <div className="flex flex-col w-full max-w-2xl">
            {/* Pending Images Preview */}
            {pendingImages.length > 0 && <div className="flex gap-2 mb-3 flex-wrap px-1">
                {pendingImages.map((img, index) => <div key={index} className="relative">
                    <img src={img.url} alt={`Pending ${index + 1}`} className="h-16 w-16 object-cover rounded-lg border border-border" />
                    <button onClick={() => removeImage(index)} className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>)}
              </div>}
            
            {/* ChatGPT-style Input Container */}
            <div className="flex items-end gap-2 bg-card/80 border border-border/50 rounded-2xl px-4 py-3 shadow-sm hover:border-border/80 transition-colors focus-within:border-border focus-within:bg-card">
              {/* Attach Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 shrink-0" title="Add attachment">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Image
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleNewChat}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    New Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Text Input */}
              <Textarea ref={textareaRef} value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask anything about your trading..." disabled={isLoading} className="flex-1 min-h-[44px] max-h-[120px] bg-transparent border-0 resize-none text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 p-0 m-0 leading-relaxed" rows={1} />
              
              {/* Hidden file input */}
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              
              {/* Send Button */}
              <Button 
                onClick={() => handleSendMessage()} 
                disabled={isLoading || (!userInput.trim() && pendingImages.length === 0)} 
                size="icon" 
                className="h-8 w-8 shrink-0 rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 disabled:hover:bg-foreground transition-all"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDeleteConversation(deleteConfirmId)} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}