import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithAuth } from '../../lib/api';
import { theme } from '../../lib/theme';

export default function ApplyMentorScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  
  // Extract parameters
  const { method, topicId, topicName } = route.params || {};

  const [bio, setBio] = useState('');
  const [topics, setTopics] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill form
  useEffect(() => {
    if (method === 'grind' && topicName) {
      setBio(`I have mastered ${topicName} on SkillBridge and would like to help others.`);
      // We show the Name to the user, but we will send the ID to the backend
      setTopics(topicName);
    }
  }, [method, topicName]);

  const handleApply = async () => {
    if (!bio || !topics) {
      Alert.alert("Missing Info", "Please fill out all fields.");
      return;
    }
    setLoading(true);
    try {
      // FIX: If method is 'grind', use the topicId (ID) instead of the text input (Name)
      let topicArray;
      
      if (method === 'grind' && topicId) {
        topicArray = [topicId]; // Correct: Send ["business"]
      } else {
        // Manual entry: assume user typed the ID or simple keywords
        topicArray = topics.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      }
      
      await fetchWithAuth('/mentorship/apply', 'POST', {
        bio,
        topics: topicArray,
        method: method || 'certificate'
      });
      
      Alert.alert(
        "Congratulations!", 
        "You are now a mentor. You can access the Mentor Dashboard from your profile.",
        [
          { text: "OK", onPress: () => nav.reset({ index: 0, routes: [{ name: 'Main' }] }) }
        ]
      );
    } catch (e) {
      Alert.alert("Error", "Application failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Become a Mentor</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={[styles.infoBox, method === 'grind' && styles.infoBoxGold]}>
          <Ionicons name={method === 'grind' ? "trophy" : "school"} size={32} color={method === 'grind' ? "#fff" : theme.colors.primary} />
          <Text style={[styles.infoTitle, method === 'grind' && {color: '#fff'}]}>
            {method === 'grind' ? "Topic Mastered!" : "Share Your Knowledge"}
          </Text>
          <Text style={[styles.infoText, method === 'grind' && {color: '#f0f0f0'}]}>
            {method === 'grind' 
              ? `You have proven your skills in ${topicName}. You are eligible to become a mentor instantly.`
              : "Help students master skills you've already conquered. Earn ratings and community respect."
            }
          </Text>
        </View>

        <Text style={styles.label}>Your Bio</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Tell us about your expertise..."
          multiline
          textAlignVertical="top"
          value={bio}
          onChangeText={setBio}
        />

        <Text style={styles.label}>Topics (comma separated)</Text>
        <TextInput
          style={[styles.input, method === 'grind' && styles.inputLocked]} 
          placeholder="e.g. finance, coding"
          value={topics}
          onChangeText={setTopics}
          editable={method !== 'grind'} 
        />

        <TouchableOpacity style={styles.applyBtn} onPress={handleApply} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Application</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', marginLeft: 16, color: theme.colors.text },
  content: { padding: 20 },
  infoBox: { backgroundColor: theme.colors.surface, padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 30 },
  infoBoxGold: { backgroundColor: theme.colors.secondary }, 
  infoTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 8, color: theme.colors.text },
  infoText: { textAlign: 'center', color: theme.colors.muted, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: theme.colors.text },
  input: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.outline, fontSize: 16 },
  inputLocked: { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.muted }, 
  applyBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});