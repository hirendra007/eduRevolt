import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithAuth } from '../lib/api';
import { theme } from '../lib/theme';

type Topic = {
  id: string;
  name: string;
  description: string;
};

type UserProfile = {
  interests?: string[];
};

export default function TopicScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  
  // Check if we are in "Mentorship" mode (passed from Sidebar)
  const isMentorshipMode = route.params?.mode === 'mentorship';

  const [topics, setTopics] = useState<Topic[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const [fetchedTopics, fetchedProfile] = await Promise.all([
          fetchWithAuth('/topics'),
          fetchWithAuth('/user-profile')
        ]);
        
        if (!cancelled) {
          setTopics(fetchedTopics);
          setUserProfile(fetchedProfile);
        }
      } catch (e) {
        console.error("Error loading topics:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, []);

  const filteredTopics = topics.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePress = (topic: Topic) => {
    if (isMentorshipMode) {
      // Go to Mentor List
      nav.navigate('MentorList', { topicId: topic.id, topicName: topic.name });
    } else {
      // Go to Lessons (Default)
      nav.navigate('Lessons', { topicId: topic.id, topicName: topic.name });
    }
  };

  const renderItem = ({ item }: { item: Topic }) => {
    const isInterested = userProfile?.interests?.some(i => 
      item.name.toLowerCase().includes(i.toLowerCase())
    );

    return (
      <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {isInterested && (
            <View style={styles.interestBadge}>
              <Ionicons name="star" size={10} color={theme.colors.primary} />
              <Text style={styles.interestText}>For You</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.actionText}>
            {isMentorshipMode ? 'Find Mentors' : 'Start Learning'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* If in mentorship mode, show back button or drawer toggle */}
        {isMentorshipMode && (
          <TouchableOpacity onPress={() => nav.openDrawer()} style={{ marginRight: 10 }}>
            <Ionicons name="menu" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          {isMentorshipMode ? 'Find a Mentor' : 'Explore Topics'}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.muted} style={{ marginRight: 10 }} />
        <TextInput 
          style={styles.searchInput} 
          placeholder={isMentorshipMode ? "Search topics to find mentors..." : "Search for a skill..."}
          placeholderTextColor={theme.colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={filteredTopics}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={theme.colors.surfaceVariant} />
              <Text style={styles.emptyText}>No topics found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: theme.typography.h1, fontWeight: '800', color: theme.colors.text },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceVariant,
  },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: theme.typography.body, height: '100%' },
  listContent: { padding: theme.spacing.lg, paddingTop: 0 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, flex: 1 },
  interestBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceVariant, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, marginLeft: 8 },
  interestText: { fontSize: 10, fontWeight: '700', color: theme.colors.primary, marginLeft: 4, textTransform: 'uppercase' },
  cardDesc: { color: theme.colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: theme.colors.surfaceVariant, paddingTop: 12 },
  actionText: { color: theme.colors.primary, fontWeight: '700', fontSize: 14, marginRight: 6 },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', color: theme.colors.muted, marginTop: 16, fontSize: theme.typography.body },
});