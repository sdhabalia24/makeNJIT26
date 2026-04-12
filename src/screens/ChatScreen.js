// src/screens/ChatScreen.js
//
// AI coaching chat interface. Users can ask about their form, reps, and workouts.

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, shadows, borderRadius } from '../theme';
import { sendChatMessage, getAllSessions } from '../api/esp32Service';
import { getSessions } from '../api/sessionStorage';

const SUGGESTED_QUESTIONS = [
  { icon: 'barbell', text: 'How was my form today?' },
  { icon: 'pulse', text: 'What can I improve?' },
  { icon: 'trophy', text: 'What are my best reps?' },
  { icon: 'alert-circle', text: 'What anomalies did I have?' },
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isLoading = msg.isLoading;

  return (
    <Animated.View
      entering={FadeInUp.duration(250)}
      style={[styles.bubbleWrap, isUser ? styles.bubbleUser : styles.bubbleAi]}
    >
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="fitness" size={16} color={colors.textPrimary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUserBg : styles.bubbleAiBg,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.textSecondary} style={{ marginVertical: 4 }} />
        ) : (
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.bubbleUserText : styles.bubbleAiText,
            ]}
          >
            {msg.content}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

function QuickReply({ item, onPress }) {
  return (
    <TouchableOpacity
      style={styles.quickReply}
      onPress={() => onPress(item.text)}
    >
      <Ionicons name={item.icon} size={14} color={colors.textSecondary} />
      <Text style={styles.quickReplyText}>{item.text}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ onQuickReply }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="chatbubbles" size={40} color={colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>AI Coach</Text>
      <Text style={styles.emptyDesc}>
        Ask about your form, reps, velocity, and anomalies. Get personalized tips based on your workout data.
      </Text>
      <View style={styles.suggestionsWrap}>
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <QuickReply key={i} item={q} onPress={onQuickReply} />
        ))}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionContext, setSessionContext] = useState('');
  const flatListRef = useRef(null);

  // Load session data and build system prompt on mount
  useEffect(() => {
    const loadSessionContext = async () => {
      try {
        let sessions = [];
        try {
          sessions = await getAllSessions();
        } catch {
          sessions = await getSessions();
        }

        if (sessions.length > 0) {
          const prompt = buildSystemPrompt(sessions);
          setSessionContext(prompt);
        }
      } catch (error) {
        console.error('Failed to load session context:', error);
      }
    };
    loadSessionContext();
  }, []);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const buildSystemPrompt = (sessions) => {
    const recentSessions = sessions.slice(0, 5); // Last 5 sessions
    
    let prompt = `You are an AI fitness coach. You have access to the user's workout data and can provide personalized advice based on their exercise sessions.\n\n`;
    
    prompt += `WORKOUT DATA:\n`;
    
    recentSessions.forEach((session, idx) => {
      const date = new Date(session.timestamp * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      
      prompt += `\nSession ${idx + 1} (${date}):\n`;
      prompt += `- Exercise: ${session._raw?.exercise || session.display_name || 'Unknown'}\n`;
      prompt += `- Reps: ${session.rep_count || 'N/A'}\n`;
      prompt += `- Form Score: ${session.form_score || 'N/A'}/100\n`;
      prompt += `- Avg Velocity: ${session.avg_velocity || 'N/A'} m/s\n`;
      
      if (session.anomalies && session.anomalies.length > 0) {
        prompt += `- Anomalies: ${session.anomalies.join(', ')}\n`;
      } else {
        prompt += `- Anomalies: None (perfect form)\n`;
      }
      
      // Add per-rep data if available
      if (session._raw?.reps && session._raw.reps.length > 0) {
        const avgRepScore = (
          session._raw.reps.reduce((sum, r) => sum + (r.form_score || 0), 0) / 
          session._raw.reps.length
        ).toFixed(1);
        prompt += `- Average Rep Score: ${avgRepScore}/100\n`;
      }
    });
    
    prompt += `\nGUIDELINES:\n`;
    prompt += `- Answer questions about the user's form, reps, velocity, and anomalies\n`;
    prompt += `- Provide specific, actionable advice based on the data\n`;
    prompt += `- If form score is low, suggest improvements\n`;
    prompt += `- If anomalies exist, explain what they mean and how to fix them\n`;
    prompt += `- Be encouraging and supportive\n`;
    prompt += `- Keep responses concise and focused\n`;
    
    return prompt;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: text },
    ]);
    setInput('');
    setIsLoading(true);

    // Add loading message
    const loadingMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: loadingMsgId, role: 'ai', content: '', isLoading: true },
    ]);

    try {
      // Build chat history for context (last 10 messages)
      const chatHistory = messages
        .slice(-10)
        .filter((msg) => !msg.isLoading)
        .map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }));

      // Get AI response with session context
      const response = await sendChatMessage(text, sessionContext, chatHistory);

      // Replace loading message with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsgId
            ? { id: loadingMsgId, role: 'ai', content: response, isLoading: false }
            : msg
        )
      );
    } catch (error) {
      console.error('AI chat error:', error);
      
      // Show error in chat
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsgId
            ? {
                id: loadingMsgId,
                role: 'ai',
                content: 'Sorry, I couldn\'t connect to the AI service. Please check your network connection and try again.',
                isLoading: false,
              }
            : msg
        )
      );
      
      Alert.alert(
        'Connection Error',
        'Unable to reach the AI service. Make sure the ESP32 service is running and accessible.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (text) => {
    if (isLoading) return;
    setInput(text);
    setTimeout(() => handleSend(), 50);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={18} color={colors.purple} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>AI Coach</Text>
            <Text style={styles.headerSubtitle}>
              {sessionContext ? 'Workout data loaded' : 'Ask about your workouts'}
            </Text>
          </View>
          {sessionContext && (
            <View style={styles.dataIndicator}>
              <Ionicons name="checkmark-circle" size={14} color={colors.ringGreen} />
            </View>
          )}
        </View>

        {/* Messages */}
        {messages.length === 0 ? (
          <EmptyState onQuickReply={handleQuickReply} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble msg={item} />}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask about your workout…"
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={input.trim() ? colors.bgPrimary : colors.textDisabled}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.purple}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 1,
  },
  dataIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.ringGreen}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    gap: 14,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '500',
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10,
  },
  quickReply: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickReplyText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Messages
  messageList: {
    padding: 16,
    gap: 8,
  },
  bubbleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  bubbleUser: {
    justifyContent: 'flex-end',
  },
  bubbleAi: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: `${colors.purple}30`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUserBg: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleAiBg: {
    backgroundColor: colors.bgCard,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  bubbleUserText: {
    color: colors.textPrimary,
  },
  bubbleAiText: {
    color: colors.textSecondary,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    backgroundColor: colors.bgPrimary,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgTertiary,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.bgTertiary,
  },
});
