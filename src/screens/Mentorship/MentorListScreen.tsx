import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithAuth } from '../../lib/api';
import { theme } from '../../lib/theme';

type Mentor = {
  uid: string;
  name: string;
  bio: string;
  rating: number;
};

export default function MentorListScreen() {
  const nav = useNavigation();
  const route = useRoute<any>();
  const { topicId, topicName } = route.params;

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadMentors = async () => {
      try {
        const data = await fetchWithAuth(`/mentorship/list/${topicId}`);
        setMentors(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadMentors();
  }, [topicId]);

  const handleRequest = async () => {
    if (!selectedMentor) return;
    setSending(true);
    try {
      await fetchWithAuth('/mentorship/request', 'POST', {
        mentorId: selectedMentor.uid,
        topicId,
        topicName,
        message
      });
      Alert.alert("Success", "Request sent! Check your profile for updates.");
      setSelectedMentor(null);
      setMessage('');
    } catch (e) {
      Alert.alert("Error", "Failed to send request.");
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }: { item: Mentor }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.bio}>{item.bio}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.requestBtn} onPress={() => setSelectedMentor(item)}>
        <Text style={styles.btnText}>Request Mentorship</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Ionicons name="arrow-back" size={24} color={theme.colors.text} /></TouchableOpacity>
        <Text style={styles.title}>Mentors for {topicName}</Text>
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} /> : (
        <FlatList
          data={mentors}
          keyExtractor={i => i.uid}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No mentors available for this topic yet.</Text>
              <Text style={styles.emptySub}>Be the first to master it!</Text>
            </View>
          }
        />
      )}

      {/* Request Modal */}
      <Modal visible={!!selectedMentor} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Message to {selectedMentor?.name}</Text>
            <Text style={styles.modalSub}>Explain what you need help with.</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Hi, I'm stuck on Lesson 3..." 
              multiline 
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setSelectedMentor(null)} disabled={sending}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendBtn} onPress={handleRequest} disabled={sending}>
                {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendText}>Send Request</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: theme.colors.outline },
  title: { fontSize: 18, fontWeight: '800', marginLeft: 10, color: theme.colors.text },
  card: { backgroundColor: theme.colors.surface, padding: 16, marginBottom: 12, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  row: { flexDirection: 'row', marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.surfaceVariant, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  bio: { color: theme.colors.muted, fontSize: 13, marginVertical: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { marginLeft: 4, fontSize: 12, fontWeight: 'bold', color: theme.colors.text },
  requestBtn: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: theme.colors.muted, fontSize: 16 },
  emptySub: { color: theme.colors.muted, fontSize: 14, marginTop: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: theme.colors.surface, padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: theme.colors.text },
  modalSub: { fontSize: 14, color: theme.colors.muted, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, padding: 12, height: 120, marginBottom: 20, color: theme.colors.text },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  cancelText: { marginRight: 20, color: theme.colors.muted, fontWeight: '600' },
  sendBtn: { backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  sendText: { color: '#fff', fontWeight: 'bold' }
});