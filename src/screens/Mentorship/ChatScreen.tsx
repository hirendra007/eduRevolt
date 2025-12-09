import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bubble, GiftedChat, IMessage, Send } from 'react-native-gifted-chat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithAuth } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { theme } from '../../lib/theme';

export default function ChatScreen() {
  const nav = useNavigation();
  const route = useRoute<any>();
  const { requestId, partnerName } = route.params;

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Wrap in useCallback to fix ESLint dependency warning
  const loadMessages = useCallback(async () => {
    try {
      const data = await fetchWithAuth(`/chat/${requestId}`);
      // Ensure dates are parsed correctly
      const formattedMessages = data.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      }));
      setMessages(formattedMessages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    const msg = newMessages[0];
    
    // Optimistic update
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));

    try {
      await fetchWithAuth(`/chat/${requestId}`, 'POST', {
        text: msg.text
      });
    } catch (e) {
      console.error("Send failed", e);
    }
  }, [requestId]);

  const renderBubble = (props: any) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: { backgroundColor: theme.colors.primary },
        left: { backgroundColor: theme.colors.surfaceVariant },
      }}
      textStyle={{
        right: { color: '#fff' },
        left: { color: theme.colors.text },
      }}
    />
  );

  const renderSend = (props: any) => (
    <Send {...props}>
      <View style={styles.sendBtn}>
        <Ionicons name="send" size={24} color={theme.colors.primary} />
      </View>
    </Send>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{partnerName}</Text>
          <Text style={styles.headerSub}>Mentorship Chat</Text>
        </View>
        <TouchableOpacity onPress={loadMessages}>
          <Ionicons name="refresh" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color={theme.colors.primary} />
      ) : (
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          user={{
            _id: auth.currentUser?.uid || 'guest',
            name: auth.currentUser?.displayName || 'User',
          }}
          renderBubble={renderBubble}
          renderSend={renderSend}
          // FIX: Pass placeholder via textInputProps to satisfy TypeScript
          textInputProps={{ placeholder: "Type a message..." }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface 
  },
  headerInfo: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  headerSub: { fontSize: 12, color: theme.colors.muted },
  sendBtn: { marginBottom: 10, marginRight: 10 },
});