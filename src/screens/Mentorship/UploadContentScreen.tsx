import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithAuth } from '../../lib/api';
import { theme } from '../../lib/theme';

export default function UploadContentScreen() {
  const nav = useNavigation();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [topicId, setTopicId] = useState(''); // Mentor types this manually for now (e.g. 'finance')
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!title || !url || !topicId) {
      Alert.alert("Missing Fields", "Please fill in Title, URL, and Topic ID.");
      return;
    }
    setLoading(true);
    try {
      await fetchWithAuth('/content', 'POST', {
        title,
        url,
        topicId: topicId.toLowerCase(),
        description: desc,
        type: 'video' // Defaulting to video for MVP
      });
      Alert.alert("Success", "Resource uploaded successfully!");
      nav.goBack();
    } catch (e) {
      Alert.alert("Error", "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Ionicons name="close" size={24} color={theme.colors.text} /></TouchableOpacity>
        <Text style={styles.title}>Upload Class Material</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} placeholder="e.g. Advanced Budgeting Strategies" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Topic ID</Text>
        <TextInput style={styles.input} placeholder="e.g. finance" value={topicId} onChangeText={setTopicId} />

        <Text style={styles.label}>Resource URL</Text>
        <TextInput style={styles.input} placeholder="e.g. https://youtube.com/..." value={url} onChangeText={setUrl} autoCapitalize="none" />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, {height: 80}]} placeholder="Brief summary..." multiline value={desc} onChangeText={setDesc} />

        <TouchableOpacity style={styles.btn} onPress={handleUpload} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Post Material</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', marginLeft: 16, color: theme.colors.text },
  label: { fontWeight: '700', marginBottom: 8, color: theme.colors.text },
  input: { backgroundColor: theme.colors.surface, padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.outline },
  btn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});