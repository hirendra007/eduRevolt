import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithAuth } from '../lib/api';
import { theme } from '../lib/theme';

type Resource = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'video' | 'pdf' | 'article';
  mentorName: string;
};

export default function TopicResourcesScreen() {
  const nav = useNavigation();
  const route = useRoute<any>();
  const { topicId, topicName } = route.params;

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchWithAuth(`/content/${topicId}`);
        setResources(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [topicId]);

  const handleOpen = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const renderItem = ({ item }: { item: Resource }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleOpen(item.url)}>
      <View style={styles.iconBox}>
        <Ionicons 
          name={item.type === 'video' ? 'play-circle' : item.type === 'pdf' ? 'document-text' : 'link'} 
          size={32} 
          color={theme.colors.primary} 
        />
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.resTitle}>{item.title}</Text>
        <Text style={styles.resMeta}>by {item.mentorName}</Text>
        {item.description ? <Text style={styles.resDesc}>{item.description}</Text> : null}
      </View>
      <Ionicons name="open-outline" size={20} color={theme.colors.muted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Ionicons name="arrow-back" size={24} color={theme.colors.text}/></TouchableOpacity>
        <Text style={styles.title}>{topicName} Resources</Text>
      </View>

      {loading ? <ActivityIndicator style={{marginTop: 20}} color={theme.colors.primary} /> : (
        <FlatList
          data={resources}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="library-outline" size={64} color={theme.colors.surfaceVariant} />
              <Text style={styles.emptyText}>No additional resources found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: theme.colors.outline },
  title: { fontSize: 20, fontWeight: '800', marginLeft: 16, color: theme.colors.text },
  card: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  resTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  resMeta: { fontSize: 12, color: theme.colors.primary, fontWeight: '600', marginTop: 2 },
  resDesc: { fontSize: 13, color: theme.colors.muted, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: theme.colors.muted, marginTop: 16 }
});