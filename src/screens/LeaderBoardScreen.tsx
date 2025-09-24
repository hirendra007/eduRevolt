import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../lib/theme';

const mock = [
  { id: 'u1', name: 'Asha', points: 920 },
  { id: 'u2', name: 'Rohit', points: 810 },
  { id: 'u3', name: 'Sneha', points: 700 }
];

export default function LeaderboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Leaderboard</Text></View>
      <FlatList data={mock} keyExtractor={i=>i.id} contentContainerStyle={{ padding: theme.spacing.md }} renderItem={({ item, index }) => (
        <View style={styles.row}>
          <Text style={styles.rank}>{index + 1}</Text>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.points}>{item.points} XP</Text>
          </View>
        </View>
      )} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.md },
  title: { fontSize: theme.typography.h1, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.sm, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm, borderRadius: theme.radii.md },
  rank: { width: 36, fontWeight: '700' },
  name: { fontWeight: '700' },
  points: { color: theme.colors.muted }
});