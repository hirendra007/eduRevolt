import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithAuth } from '../../lib/api';
import { theme } from '../../lib/theme';

type Request = { 
  id: string; 
  mentorId: string; 
  topicName: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
};

export default function StudentRequestsScreen() {
  const nav = useNavigation<any>();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
    try {
      const data = await fetchWithAuth('/mentorship/requests/sent');
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const renderItem = ({ item }: { item: Request }) => {
    let statusColor = theme.colors.muted;
    let iconName = "time";

    if (item.status === 'accepted') { statusColor = theme.colors.success; iconName = "checkmark-circle"; }
    if (item.status === 'rejected') { statusColor = theme.colors.error; iconName = "close-circle"; }

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.topic}>{item.topicName}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
             <Ionicons name={iconName as any} size={12} color={statusColor} style={{marginRight:4}} />
             <Text style={[styles.statusText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={styles.sub}>Request sent for mentorship</Text>
        
        {item.status === 'accepted' && (
          <TouchableOpacity 
            style={styles.chatBtn}
            onPress={() => nav.navigate('Chat', { 
              requestId: item.id, 
              partnerName: "Mentor" // Ideally fetch mentor's real name if available
            })}
          >
            <Ionicons name="chatbubbles" size={18} color="#fff" />
            <Text style={styles.chatText}>Chat with Mentor</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text}/>
        </TouchableOpacity>
        <Text style={styles.title}>My Requests</Text>
      </View>

      {loading ? <ActivityIndicator style={{marginTop: 20}} color={theme.colors.primary} /> : (
        <FlatList
          data={requests}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); loadRequests();}} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="paper-plane-outline" size={48} color={theme.colors.muted} />
              <Text style={styles.emptyText}>No requests sent yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: theme.colors.outline },
  title: { fontSize: 20, fontWeight: '800', marginLeft: 16, color: theme.colors.text },
  card: { backgroundColor: theme.colors.surface, padding: 16, marginBottom: 12, borderRadius: 12, borderWidth:1, borderColor: theme.colors.outline },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  topic: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  badge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '800' },
  sub: { color: theme.colors.muted, fontSize: 13, marginBottom: 12 },
  chatBtn: { backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8 },
  chatText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: theme.colors.muted, marginTop: 10 }
});