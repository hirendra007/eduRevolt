import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../lib/firebase';
import { theme } from '../lib/theme';

type Topic = {
  id: string;
  name: string;
  description: string;
};

type UserProfile = {
  userId: string;
  totalXp: number;
  completedLessons: string[];
  currentStreak: number;
  lastActivityDate: string;
  name?: string; 
  interests?: string[]; // Added for personalization
};

// Helper for authenticated requests
async function fetchWithAuth(url: string) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated.');
  }

  const idToken = await user.getIdToken();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('API request failed.');
  }

  return response.json();
}

async function fetchTopicsFromApi(): Promise<Topic[]> {
  const data: Topic[] = await fetchWithAuth('https://skillbridge-backend-2-gq5c.onrender.com/topics');
  return data;
}

async function fetchUserProfile(): Promise<UserProfile> {
  const data: UserProfile = await fetchWithAuth('https://skillbridge-backend-2-gq5c.onrender.com/user-profile');
  return data;
}

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [fetchedTopics, fetchedUserProfile] = await Promise.all([
          fetchTopicsFromApi(),
          fetchUserProfile()
        ]);
        
        if (!cancelled) {
          setTopics(fetchedTopics);
          setUserProfile(fetchedUserProfile);
        }
      } catch (e: unknown) {
        console.log('Error fetching home data:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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

  const openTopic = (topicId: string, topicName: string) => {
    nav.navigate('Lessons', { topicId, topicName });
  };

  // --- Personalization Logic ---
  const myInterests = userProfile?.interests || [];
  
  // Find topics that match user interests (simple string matching)
  const recommendedTopics = topics.filter(t => 
    myInterests.some(interest => t.name.toLowerCase().includes(interest.toLowerCase()))
  );

  // If recommendations exist, show them. Otherwise show all topics.
  const displayTopics = recommendedTopics.length > 0 ? recommendedTopics : topics;
  const sectionTitle = recommendedTopics.length > 0 ? "Recommended For You" : "All Topics";

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {userProfile?.name || 'Learner'} 👋</Text>
          <Text style={styles.sub}>
            {userProfile?.totalXp || 0} XP • 🔥 {userProfile?.currentStreak || 0}-day streak
          </Text>
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
              nav.navigate('Lessons', {
                topicId: '8j9lpFqRsnAdwAeCtzZV',
                topicName: 'Indian Law',
              })
            }
          >
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Start</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        <TouchableOpacity onPress={() => nav.navigate('InterestSelection')}>
           <Text style={styles.sectionAction}>Edit Interests</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayTopics}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: theme.spacing.md }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: theme.colors.muted, marginTop: 20 }}>
            No topics found matching your interests.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.topicCard} onPress={() => openTopic(item.id, item.name)}>
            <View>
              <Text style={styles.topicTitle}>{item.name}</Text>
              {item.description ? (
                 <Text style={styles.topicDesc} numberOfLines={2}>{item.description}</Text>
              ) : null}
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
        )}
      />
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