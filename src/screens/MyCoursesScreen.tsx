import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithAuth } from '../lib/api';
import { theme } from '../lib/theme';

type TopicProgress = {
  topicId: string;
  topicName: string;
  totalLessons: number;
  completedCount: number;
  percent: number;
  nextLessonId: string | null;
};

export default function MyCoursesScreen() {
  const nav = useNavigation<any>();
  const [progressData, setProgressData] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [topics, userProfile] = await Promise.all([
          fetchWithAuth('/topics'),
          fetchWithAuth('/user-profile')
        ]);

        const completedIds = userProfile.completedLessons || [];
        const calculatedProgress: TopicProgress[] = [];

        for (const topic of topics) {
          const lessons = await fetchWithAuth(`/lessons/${topic.id}`);
          if (lessons.length === 0) continue;

          const topicLessonIds = lessons.map((l: any) => l.id);
          const completedInTopic = topicLessonIds.filter((id: string) => completedIds.includes(id)).length;

          if (completedInTopic === 0) continue;

          const nextLesson = lessons.find((l: any) => !completedIds.includes(l.id));

          calculatedProgress.push({
            topicId: topic.id,
            topicName: topic.name,
            totalLessons: lessons.length,
            completedCount: completedInTopic,
            percent: completedInTopic / lessons.length,
            nextLessonId: nextLesson ? nextLesson.id : null
          });
        }
        setProgressData(calculatedProgress);
      } catch (e) {
        console.error("Error calculating progress:", e);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = nav.addListener('focus', loadData);
    return unsubscribe;
  }, [nav]);

  const handleContinue = (item: TopicProgress) => {
    // FIX: Use Nested Navigation to jump into the Tabs
    nav.navigate('Dashboard', {
      screen: 'Home', // Go to the Home Tab
      params: {
        screen: 'Lessons', // Go to the Lessons Screen inside Home Stack
        params: { 
          topicId: item.topicId, 
          topicName: item.topicName 
        }
      }
    });
  };

  const renderItem = ({ item }: { item: TopicProgress }) => {
    const isComplete = item.percent === 1;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.topicName}>{item.topicName}</Text>
          {isComplete && <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />}
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${item.percent * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {item.completedCount}/{item.totalLessons}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.actionButton, isComplete ? styles.btnComplete : styles.btnContinue]}
          onPress={() => handleContinue(item)}
        >
          <Text style={[styles.btnText, isComplete && { color: theme.colors.success }]}>
            {isComplete ? 'Review Course' : 'Continue Learning'}
          </Text>
          {!isComplete && <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />}
        </TouchableOpacity>
      </View>
    );
  };

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
        {/* Added Menu Button to Toggle Sidebar */}
        <TouchableOpacity onPress={() => nav.openDrawer()} style={{ marginRight: 15 }}>
          <Ionicons name="menu" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>My Learning</Text>
      </View>

      <FlatList
        data={progressData}
        keyExtractor={(item) => item.topicId}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color={theme.colors.surfaceVariant} />
            <Text style={styles.emptyTitle}>No courses started yet</Text>
            <Text style={styles.emptySub}>
              Explore the Topics tab to start your first lesson!
            </Text>
            {/* Fix navigation for Explore button too */}
            <TouchableOpacity 
              style={styles.exploreBtn} 
              onPress={() => nav.navigate('Dashboard', { screen: 'Explore' })}
            >
               <Text style={styles.exploreBtnText}>Find a Course</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.lg, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: theme.typography.h1, fontWeight: '800', color: theme.colors.text },
  list: { padding: theme.spacing.lg },
  card: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radii.lg,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  topicName: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: theme.colors.surfaceVariant, borderRadius: 4, marginRight: 12 },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: '600', color: theme.colors.muted },
  actionButton: {
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnContinue: { backgroundColor: theme.colors.primary },
  btnComplete: { backgroundColor: theme.colors.surfaceVariant, borderWidth: 1, borderColor: theme.colors.success },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: theme.colors.muted, textAlign: 'center', marginTop: 8, maxWidth: '80%' },
  exploreBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: theme.colors.primary, borderRadius: theme.radii.lg },
  exploreBtnText: { color: '#fff', fontWeight: 'bold' }
});