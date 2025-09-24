import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../lib/theme';

type Topic = {
  id: string;
  name: string;
  description: string;
};

async function fetchTopicsFromApi(): Promise<Topic[]> {
  const response = await fetch('https://skillsphere-backend-uur2.onrender.com/topics');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data: Topic[] = await response.json();
  return data;
}

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const fetchedTopics = await fetchTopicsFromApi();
        if (!cancelled && fetchedTopics) {
          setTopics(fetchedTopics);
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.log('Could not fetch topics:', e.message);
        } else {
          console.log('Could not fetch topics:', e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => pulse());
  }, [scaleAnim]);

  useEffect(() => {
    pulse();
  }, [pulse]);

  const openTopic = (topicName: string) => {
    nav.navigate('Lessons', { topicName });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, Learner 👋</Text>
          <Text style={styles.sub}>170 XP • 🔥 3-day streak</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => nav.navigate('Profile')}>
          <View style={styles.avatarPlaceholder} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.dailyCardWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={[theme.colors.primary, theme.colors.tertiary]} style={styles.dailyCard}>
          <Text style={styles.dailyTitle}>Daily 5-min lesson</Text>
          <Text style={styles.dailySubtitle}>Quick practice to keep your streak</Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() =>
              nav.navigate('Lesson', {
                topicName: 'Finance',
                lessonId: 'budgeting-101',
              })
            }
          >
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Start</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Topics</Text>
        <Text style={styles.sectionAction}>See all</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.md }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.topicCard} onPress={() => openTopic(item.name)}>
              <View>
                <Text style={styles.topicTitle}>{item.name}</Text>
                <Text style={styles.topicDesc}>{item.description || 'Description not available.'}</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: theme.typography.h1, fontWeight: '800', color: theme.colors.text },
  sub: { color: theme.colors.muted, marginTop: 4, fontSize: theme.typography.small },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
  profileBtn: { padding: theme.spacing.xs, borderRadius: theme.radii.sm },
  dailyCardWrapper: { margin: theme.spacing.lg, borderRadius: theme.radii.lg, overflow: 'hidden' },
  dailyCard: { padding: theme.spacing.lg, borderRadius: theme.radii.lg },
  dailyTitle: { color: '#fff', fontWeight: '800', fontSize: theme.typography.h2 },
  dailySubtitle: { color: '#fff', marginTop: 6, opacity: 0.8 },
  startBtn: {
    marginTop: 16,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: theme.radii.md,
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontWeight: '800', fontSize: theme.typography.h2 },
  sectionAction: { color: theme.colors.primary, fontSize: theme.typography.small, fontWeight: '600' },
  topicCard: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  topicTitle: { fontWeight: '700', fontSize: theme.typography.body },
  topicDesc: { color: theme.colors.muted, marginTop: 4, fontSize: theme.typography.small },
  chev: { color: theme.colors.muted },
});