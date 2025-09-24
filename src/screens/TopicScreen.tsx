import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../lib/theme';

const mockLessons = [
  { id: 'lesson_fin_1', title: 'First Salary: Budgeting', xp: 40, difficulty: 'easy' },
  { id: 'lesson_fin_2', title: 'Save vs Invest', xp: 30, difficulty: 'medium' },
  { id: 'lesson_fin_3', title: 'Emergency Fund', xp: 20, difficulty: 'easy' }
];

export default function TopicScreen() {
  const nav = useNavigation<any>();
  const route = useRoute();
  // @ts-ignore
  const topicId = route.params?.topicId || 'finance';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{topicId.toUpperCase()}</Text>
        <Text style={styles.subtitle}>Learn the fundamentals with short micro-lessons</Text>
      </View>

      <FlatList data={mockLessons} keyExtractor={l => l.id} contentContainerStyle={{ padding: theme.spacing.md }} renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => nav.navigate('Lesson', { lessonId: item.id })}>
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.xp} XP • {item.difficulty}</Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </TouchableOpacity>
      )} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.md },
  title: { fontSize: theme.typography.h1, fontWeight: '800', color: theme.colors.text },
  subtitle: { color: theme.colors.muted, marginTop: 6 },
  card: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.radii.md, marginBottom: theme.spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '700' },
  cardSubtitle: { color: theme.colors.muted, marginTop: 6 },
  chev: { color: theme.colors.muted }
});