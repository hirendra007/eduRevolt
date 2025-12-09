import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithAuth } from '../../lib/api';
import { theme } from '../../lib/theme';

type Request = { 
  id: string; 
  studentName: string; 
  topicName: string;
  message: string; 
  status: 'pending' | 'accepted' | 'rejected';
};

export default function MentorDashboardScreen() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const nav = useNavigation<any>();

  const loadRequests = async () => {
    try {
      const data = await fetchWithAuth('/mentorship/dashboard');
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAction = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await fetchWithAuth(`/mentorship/request/${id}`, 'PUT', { status });
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    } catch (e) {
      Alert.alert("Error", "Action failed");
    }
  };

  const renderItem = ({ item }: { item: Request }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.topicBadge}>{item.topicName}</Text>
        <Text style={[
          styles.status, 
          item.status === 'pending' ? styles.statusPending : 
          item.status === 'accepted' ? styles.statusAccepted : styles.statusRejected
        ]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.student}>{item.studentName}</Text>
      <Text style={styles.msg}>&ldquo;{item.message}&ldquo;</Text>
      
      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.reject]} onPress={() => handleAction(item.id, 'rejected')}>
            <Ionicons name="close" size={16} color="#d32f2f" />
            <Text style={[styles.btnText, {color: '#d32f2f'}]}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.accept]} onPress={() => handleAction(item.id, 'accepted')}>
            <Ionicons name="checkmark" size={16} color="#388e3c" />
            <Text style={[styles.btnText, {color: '#388e3c'}]}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* NEW: Chat Button for Accepted Requests */}
      {item.status === 'accepted' && (
        <TouchableOpacity 
          style={styles.chatBtn}
          onPress={() => nav.navigate('Chat', { 
            requestId: item.id, 
            partnerName: item.studentName 
          })}
        >
          <Ionicons name="chatbubbles" size={18} color="#fff" style={{marginRight:8}} />
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Chat with Student</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Ionicons name="close" size={24} color={theme.colors.text}/></TouchableOpacity>
        <Text style={styles.title}>Mentor Dashboard</Text>
      </View>

      {/* Upload Content Button */}
      <View style={styles.actionHeader}>
        <TouchableOpacity 
          style={styles.uploadBtn} 
          onPress={() => nav.navigate('UploadContent')}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.uploadBtnText}>Upload Class Material</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={{marginTop: 20}} /> : (
        <FlatList
          data={requests}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); loadRequests();}} />}
          ListEmptyComponent={<Text style={{textAlign:'center', marginTop: 40, color: theme.colors.muted}}>No pending requests.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: theme.colors.outline },
  title: { fontSize: 20, fontWeight: '800', marginLeft: 16, color: theme.colors.text },
  actionHeader: { padding: 16, paddingBottom: 0 },
  uploadBtn: { backgroundColor: theme.colors.secondary, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  uploadBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  
  card: { backgroundColor: theme.colors.surface, padding: 16, marginBottom: 12, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  topicBadge: { fontSize: 10, backgroundColor: theme.colors.surfaceVariant, padding: 4, paddingHorizontal: 8, borderRadius: 4, overflow: 'hidden', fontWeight: 'bold', color: theme.colors.primary },
  status: { fontSize: 10, fontWeight: '800' },
  statusPending: { color: '#f57c00' },
  statusAccepted: { color: '#388e3c' },
  statusRejected: { color: '#d32f2f' },
  student: { fontSize: 16, fontWeight: '700', marginBottom: 4, color: theme.colors.text },
  msg: { fontStyle: 'italic', color: theme.colors.muted, marginBottom: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  reject: { borderColor: '#ef9a9a', backgroundColor: '#ffebee' },
  accept: { borderColor: '#a5d6a7', backgroundColor: '#e8f5e9' },
  btnText: { fontWeight: '700', marginLeft: 6, fontSize: 12 },
  
  // Chat Button Style
  chatBtn: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 }
});