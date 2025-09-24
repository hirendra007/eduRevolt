import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../lib/theme';

const badges = [ 'starter', 'first_lesson_finance' ];
const recent = [ 'Completed: First Salary', 'Earned: 20 XP' ];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.points}>170 XP</Text>
        <Text style={styles.streak}>🔥 3-day streak</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges</Text>
        <View style={{ flexDirection: 'row', paddingTop: 8 }}>
          {badges.map(b => <View key={b} style={styles.badge}><Text>{b}</Text></View>)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent</Text>
        <FlatList data={recent} keyExtractor={i=>i} renderItem={({ item })=> <Text style={{ paddingVertical: 8 }}>{item}</Text>} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  header: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.radii.md, marginBottom: theme.spacing.md },
  points: { fontSize: 22, fontWeight: '800' },
  streak: { color: theme.colors.muted, marginTop: 6 },
  section: { marginTop: theme.spacing.md },
  sectionTitle: { fontWeight: '700' },
  badge: { backgroundColor: theme.colors.surfaceVariant, padding: 10, borderRadius: theme.radii.sm, marginRight: 8 }
});