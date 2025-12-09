import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithAuth } from '../../lib/api';
import { theme } from '../../lib/theme';

const AVAILABLE_TOPICS = [
  { id: 'finance', label: 'Personal Finance', icon: '💰' },
  { id: 'coding', label: 'Programming', icon: '💻' },
  { id: 'design', label: 'Design', icon: '🎨' },
  { id: 'marketing', label: 'Marketing', icon: '📈' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
];

export default function InterestSelectionScreen() {
  const nav = useNavigation<any>();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleContinue = async () => {
    if (selected.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one topic to continue.');
      return;
    }
    setLoading(true);
    try {
      await fetchWithAuth('/user-profile', 'PUT', { interests: selected });
      nav.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      Alert.alert('Error', 'Failed to save interests.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pick Your Path</Text>
        <Text style={styles.subtitle}>What skills do you want to master?</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {AVAILABLE_TOPICS.map((topic) => {
          const isSelected = selected.includes(topic.id);
          return (
            <TouchableOpacity
              key={topic.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => toggleInterest(topic.id)}
            >
              <Text style={styles.icon}>{topic.icon}</Text>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{topic.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Start Learning</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.lg, paddingTop: 40 },
  title: { fontSize: theme.typography.h1, fontWeight: '800', color: theme.colors.text },
  subtitle: { color: theme.colors.muted, marginTop: 8, fontSize: theme.typography.body },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: theme.spacing.md, justifyContent: 'space-between' },
  card: {
    width: '48%', backgroundColor: theme.colors.surface, padding: 20, borderRadius: theme.radii.lg,
    marginBottom: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }
  },
  cardSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceVariant },
  icon: { fontSize: 32, marginBottom: 10 },
  label: { fontWeight: '600', color: theme.colors.text, textAlign: 'center' },
  labelSelected: { color: theme.colors.primary },
  footer: { padding: theme.spacing.lg },
  button: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: theme.radii.lg, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});