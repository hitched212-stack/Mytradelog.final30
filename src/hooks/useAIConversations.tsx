import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface AIConversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export function useAIConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Load all conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setConversations(data?.map(c => ({
        id: c.id,
        title: c.title,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at)
      })) || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data?.map(m => ({
        id: m.id,
        conversationId: m.conversation_id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: new Date(m.created_at)
      })) || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  // Create a new conversation
  const createConversation = useCallback(async (firstMessage?: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const title = firstMessage 
        ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
        : 'New Chat';

      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({ user_id: user.id, title })
        .select()
        .single();

      if (error) throw error;

      const newConversation: AIConversation = {
        id: data.id,
        title: data.title,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversationId(data.id);
      setMessages([]);
      
      return data.id;
    } catch (err) {
      console.error('Error creating conversation:', err);
      return null;
    }
  }, [user]);

  // Add a message to the current conversation
  const addMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<AIMessage | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role,
          content
        })
        .select()
        .single();

      if (error) throw error;

      const newMessage: AIMessage = {
        id: data.id,
        conversationId: data.conversation_id,
        role: data.role as 'user' | 'assistant',
        content: data.content,
        createdAt: new Date(data.created_at)
      };

      setMessages(prev => [...prev, newMessage]);

      // Update conversation's updated_at timestamp
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Update local conversations list
      setConversations(prev => {
        const updated = prev.map(c => 
          c.id === conversationId 
            ? { ...c, updatedAt: new Date() }
            : c
        );
        return updated.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      });

      return newMessage;
    } catch (err) {
      console.error('Error adding message:', err);
      return null;
    }
  }, [user]);

  // Update conversation title (based on first user message)
  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    if (!user) return;

    try {
      const truncatedTitle = title.slice(0, 50) + (title.length > 50 ? '...' : '');
      
      await supabase
        .from('ai_conversations')
        .update({ title: truncatedTitle })
        .eq('id', conversationId);

      setConversations(prev => 
        prev.map(c => c.id === conversationId ? { ...c, title: truncatedTitle } : c)
      );
    } catch (err) {
      console.error('Error updating conversation title:', err);
    }
  }, [user]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  }, [user, currentConversationId]);

  // Select a conversation
  const selectConversation = useCallback(async (conversationId: string | null) => {
    setCurrentConversationId(conversationId);
    if (conversationId) {
      await loadMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [loadMessages]);

  // Start a new chat
  const startNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // Get all messages for AI context (for personalization)
  const getAllMessagesForContext = useCallback(async (): Promise<AIMessage[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Last 50 messages for context

      if (error) throw error;

      return data?.map(m => ({
        id: m.id,
        conversationId: m.conversation_id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: new Date(m.created_at)
      })) || [];
    } catch (err) {
      console.error('Error loading context messages:', err);
      return [];
    }
  }, [user]);

  return {
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
    loadConversations,
    getAllMessagesForContext,
    setMessages
  };
}
