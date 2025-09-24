import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../lib/firebase';
import { theme } from '../lib/theme';

const mockTopics = [
  { id: 'finance', title: 'Finance', icon: 'wallet', description: 'Salary, budgeting, saving' },
  { id: 'health', title: 'Health', icon: 'heart', description: 'Fitness & wellbeing' },
  { id: 'law', title: 'Law', icon: 'gavel', description: 'Know your rights' }
];

export default function HomeScreen() {
  // Use a type assertion to provide type information to the navigation object
  const nav = useNavigation<any>(); 
  const [topics, setTopics] = useState<any[]>(mockTopics);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Attempt to read topics from Firestore; fallback to mockTopics if collection missing
        const q = query(collection(db, 'topics'));
        const snap = await getDocs(q);
        if (!cancelled && !snap.empty) {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setTopics(data as any);
        }
      } catch (e: unknown) { // Use 'unknown' type and then check
        // Type check to safely access 'message'
        if (e instanceof Error) {
            console.log('Could not fetch topics, using mock', e.message);
        } else {
            console.log('Could not fetch topics, using mock', e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const openTopic = (topicId: string) => {
    // TypeScript is now aware of the navigation structure
    nav.navigate('Topics', { topicId }); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, Learner 👋</Text>
          <Text style={styles.sub}>170 XP • 🔥 3-day streak</Text>
        </View>
        <View style={styles.avatarPlaceholder} />
      </View>

      <View style={styles.dailyCard}>
        <Text style={styles.dailyTitle}>Daily 5-min lesson</Text>
        <Text style={styles.dailySubtitle}>Quick practice to keep your streak</Text>
        <TouchableOpacity style={styles.startBtn} onPress={() => nav.navigate('Lesson' as any, { lessonId: 'finance_salary_001' })}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Start</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Topics</Text>
        <Text style={styles.sectionAction}>See all</Text>
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} /> : (
        <FlatList data={topics} keyExtractor={i=>i.id} contentContainerStyle={{ padding: theme.spacing.md }} renderItem={({ item }) => (
          <TouchableOpacity style={styles.topicCard} onPress={() => openTopic(item.id)}>
            <View>
              <Text style={styles.topicTitle}>{item.title}</Text>
              <Text style={styles.topicDesc}>{item.description}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
        )} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: theme.typography.h2, fontWeight: '800', color: theme.colors.text },
  sub: { color: theme.colors.muted, marginTop: 6 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.surfaceVariant },
  dailyCard: { margin: theme.spacing.md, padding: theme.spacing.md, backgroundColor: theme.colors.primary, borderRadius: theme.radii.lg },
  dailyTitle: { color: '#fff', fontWeight: '800', fontSize: theme.typography.h2 },
  dailySubtitle: { color: '#fff', marginTop: 6 },
  startBtn: { marginTop: 12, backgroundColor: '#0A62C9', paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radii.md, alignSelf: 'flex-start' },
  sectionHeader: { paddingHorizontal: theme.spacing.md, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontWeight: '800' },
  sectionAction: { color: theme.colors.primary },
  topicCard: { marginTop: theme.spacing.sm, backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.radii.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topicTitle: { fontWeight: '700' },
  topicDesc: { color: theme.colors.muted, marginTop: 6 },
  chev: { color: theme.colors.muted }
});