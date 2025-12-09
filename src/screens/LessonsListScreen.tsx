import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchWithAuth } from '../lib/api';
import { theme } from '../lib/theme';

type Lesson = {
  id: string;
  title: string;
  xp: number;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
};

type UserProfile = { completedLessons: string[]; };

export default function LessonsListScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { topicName, topicId } = route.params || {};
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [canGraduate, setCanGraduate] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedLessons, profile] = await Promise.all([
          fetchWithAuth(`/lessons/${topicId}`),
          fetchWithAuth('/user-profile')
        ]);
        setLessons(fetchedLessons);
        setCompletedIds((profile as UserProfile).completedLessons || []);
      } catch (e) {
        console.error("Error loading lessons:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [topicId]);

  // --- PATH A LOGIC ---
  useEffect(() => {
    if (lessons.length > 0) {
      const hardLessons = lessons.filter(l => l.difficulty === 'hard');
      const allHardDone = hardLessons.length > 0 && hardLessons.every(l => completedIds.includes(l.id));
      setCanGraduate(allHardDone);
    }
  }, [lessons, completedIds]);

  const handleGraduate = () => {
    nav.navigate('Become a Mentor', { 
      method: 'grind', 
      topicId: topicId, 
      topicName: topicName 
    });
  };

  const isUnlocked = (difficulty: string) => {
    if (difficulty === 'easy') return true;
    const easyLessons = lessons.filter(l => l.difficulty === 'easy');
    const easyDone = easyLessons.every(l => completedIds.includes(l.id));
    if (difficulty === 'medium') return easyDone;
    const medLessons = lessons.filter(l => l.difficulty === 'medium');
    const medDone = medLessons.every(l => completedIds.includes(l.id));
    return easyDone && medDone;
  };

  const handlePress = (lesson: Lesson, locked: boolean) => {
    if (locked) {
      Alert.alert("Locked", "Complete the previous difficulty level first.");
      return;
    }
    nav.navigate('Lesson', { lessonData: lesson });
  };

  const renderItem = ({ item }: { item: Lesson }) => {
    const locked = !isUnlocked(item.difficulty);
    const completed = completedIds.includes(item.id);

    return (
      <TouchableOpacity 
        style={[styles.card, locked && styles.cardLocked]} 
        onPress={() => handlePress(item, locked)}
        activeOpacity={locked ? 0.9 : 0.6}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Text style={[styles.cardTitle, locked && styles.textLocked]}>{item.title}</Text>
            {completed && <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} style={{marginLeft: 6}}/>}
          </View>
          <Text style={styles.cardSubtitle}>
            {item.xp} {t('xp')} • {item.difficulty.toUpperCase()}
          </Text>
        </View>
        {locked ? (
          <Ionicons name="lock-closed" size={20} color={theme.colors.muted} />
        ) : (
          <Text style={styles.chev}>›</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={{ paddingRight: 10 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: theme.typography.body }}>‹ {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{topicName || t('lessons')}</Text>
      </View>

      {/* GRADUATION BANNER */}
      {canGraduate && (
        <TouchableOpacity style={styles.graduateBanner} onPress={handleGraduate}>
          <LinearGradient 
            colors={[theme.colors.secondary, theme.colors.primary]} 
            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
            style={styles.graduateGradient}
          >
            <View style={styles.iconCircle}>
               <Ionicons name="trophy" size={20} color={theme.colors.primary} />
            </View>
            <View style={{marginLeft: 12, flex: 1}}>
              <Text style={styles.gradTitle}>Topic Mastered!</Text>
              <Text style={styles.gradSub}>Tap to become a Mentor for {topicName}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#fff"/>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 120 }} // Increased bottom padding for FABs
          renderItem={renderItem}
        />
      )}

      {/* --- FAB GROUP --- */}

      {/* 1. Resources Button (New) */}
      <TouchableOpacity 
        style={styles.resourcesBtn} 
        onPress={() => nav.navigate('TopicResources', { topicId, topicName })}
      >
        <Ionicons name="library" size={20} color="#fff" />
        <Text style={styles.fabText}>Resources</Text>
      </TouchableOpacity>

      {/* 2. Discuss Button */}
      <TouchableOpacity 
        style={styles.communityBtn} 
        onPress={() => nav.navigate('Community', { topicId, topicName })}
      >
        <Ionicons name="people" size={20} color="#fff" />
        <Text style={styles.fabText}>Discuss</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.lg, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: theme.typography.h1, fontWeight: '800', color: theme.colors.text, marginLeft: 8 },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  cardLocked: { backgroundColor: theme.colors.surfaceVariant, opacity: 0.7 },
  cardTitle: { fontWeight: '700', fontSize: theme.typography.body, color: theme.colors.text, flexShrink: 1 },
  textLocked: { color: theme.colors.muted },
  cardSubtitle: { color: theme.colors.muted, marginTop: 6, fontSize: theme.typography.small },
  chev: { color: theme.colors.muted },
  row: { flexDirection: 'row', alignItems: 'center' },
  
  // --- FAB Styles ---
  communityBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: theme.colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10
  },
  resourcesBtn: {
    position: 'absolute',
    bottom: 90, // Stacked above the community button
    right: 20,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10
  },
  fabText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },

  // Graduation Banner Styles
  graduateBanner: { 
    marginHorizontal: 16, 
    marginBottom: 8, 
    borderRadius: 12, 
    overflow: 'hidden', 
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 }
  },
  graduateGradient: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  gradTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  gradSub: { fontSize: 12, color: '#f0f0f0', marginTop: 2 },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center'
  }
});