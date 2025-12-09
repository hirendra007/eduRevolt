import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithAuth } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { theme } from '../../lib/theme';

type Post = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: any;
  replyCount: number;
};

export default function CommunityScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { topicId, topicName } = route.params;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  // New Post State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [posting, setPosting] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(`/community/${topicId}`);
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [topicId]);

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setPosting(true);
    try {
      await fetchWithAuth('/community', 'POST', {
        topicId,
        title: newTitle,
        content: newContent,
        authorName: auth.currentUser?.displayName
      });
      setModalVisible(false);
      setNewTitle('');
      setNewContent('');
      loadPosts(); // Refresh
    } catch (e) {
      Alert.alert("Error", "Could not create post");
    } finally {
      setPosting(false);
    }
  };

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => nav.navigate('PostDetail', { postId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.author}>{item.authorName}</Text>
        <Text style={styles.date}>Just now</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.preview} numberOfLines={2}>{item.content}</Text>
      <View style={styles.cardFooter}>
        <Ionicons name="chatbubble-outline" size={16} color={theme.colors.muted} />
        <Text style={styles.stats}>{item.replyCount || 0} replies</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={{marginRight: 10}}>
           <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{topicName} Community</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 20}} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: theme.spacing.md }}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No discussions yet. Start one!</Text>}
        />
      )}

      {/* FAB to create post */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Discussion</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{color: theme.colors.error}}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            placeholder="Title (e.g., Question about Lesson 3)"
            style={styles.inputTitle}
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            placeholder="What's on your mind?"
            style={styles.inputBody}
            multiline
            value={newContent}
            onChangeText={setNewContent}
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={[styles.postBtn, posting && {opacity: 0.7}]} 
            onPress={handleCreatePost}
            disabled={posting}
          >
            {posting ? <ActivityIndicator color="#fff"/> : <Text style={styles.postBtnText}>Post</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.surface },
  headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  card: { backgroundColor: theme.colors.surface, padding: 16, marginBottom: 12, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  author: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
  date: { fontSize: 12, color: theme.colors.muted },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  preview: { fontSize: 14, color: theme.colors.muted, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  stats: { fontSize: 12, color: theme.colors.muted, marginLeft: 6 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: {width: 0, height: 4}, elevation: 5 },
  empty: { textAlign: 'center', marginTop: 40, color: theme.colors.muted },
  
  // Modal Styles
  modalContainer: { flex: 1, padding: 20, backgroundColor: theme.colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  inputTitle: { fontSize: 18, fontWeight: '600', padding: 12, backgroundColor: theme.colors.surface, borderRadius: 8, marginBottom: 12 },
  inputBody: { flex: 1, fontSize: 16, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 8, marginBottom: 12 },
  postBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  postBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});