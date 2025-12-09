import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithAuth } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { theme } from '../../lib/theme';

type Reply = { id: string; content: string; authorName: string; };
type PostDetail = { 
  post: { id: string; title: string; content: string; authorName: string; }; 
  replies: Reply[]; 
};

export default function PostDetailScreen() {
  const nav = useNavigation();
  const route = useRoute<any>();
  const { postId } = route.params;

  const [data, setData] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetchWithAuth(`/community/post/${postId}`);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [postId]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await fetchWithAuth(`/community/post/${postId}/reply`, 'POST', {
        content: replyText,
        authorName: auth.currentUser?.displayName
      });
      setReplyText('');
      loadData(); // Refresh list
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (loading || !data) return <SafeAreaView style={styles.container}><ActivityIndicator color={theme.colors.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
           <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={data.replies}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={styles.postContainer}>
            <Text style={styles.title}>{data.post.title}</Text>
            <View style={styles.metaRow}>
                <View style={styles.avatar} />
                <Text style={styles.author}>{data.post.authorName}</Text>
            </View>
            <Text style={styles.content}>{data.post.content}</Text>
            <View style={styles.divider} />
            <Text style={styles.sectionHeader}>Replies</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.replyCard}>
            <Text style={styles.replyAuthor}>{item.authorName}</Text>
            <Text style={styles.replyContent}>{item.content}</Text>
          </View>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={10}>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="Add a reply..." 
            value={replyText}
            onChangeText={setReplyText}
          />
          <TouchableOpacity onPress={handleSendReply} disabled={sending}>
            <Ionicons name="send" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 16 },
  postContainer: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12, color: theme.colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.colors.surfaceVariant, marginRight: 8 },
  author: { fontWeight: '600', color: theme.colors.text },
  content: { fontSize: 16, lineHeight: 24, color: theme.colors.text },
  divider: { height: 1, backgroundColor: theme.colors.outline, marginVertical: 20 },
  sectionHeader: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  
  replyCard: { backgroundColor: theme.colors.surface, padding: 12, borderRadius: 8, marginBottom: 10 },
  replyAuthor: { fontSize: 12, fontWeight: '700', color: theme.colors.primary, marginBottom: 4 },
  replyContent: { fontSize: 14, color: theme.colors.text },

  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderColor: theme.colors.outline },
  input: { flex: 1, backgroundColor: theme.colors.background, padding: 10, borderRadius: 20, marginRight: 10 },
});