import { useNavigation, useRoute } from '@react-navigation/native';
import { getAuth } from 'firebase/auth'; // Added getAuth import
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../lib/theme';

// New authenticated fetch helper
async function fetchWithAuth(url: string) {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error('User not authenticated.');
  }

  const idToken = await user.getIdToken();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('API request failed.');
  }

  return response.json();
}

type LessonContent = {
  id: string;
  type: string;
  prompt?: string;
  text?: string;
  choices?: { id: string; text: string; xp: number; explain: string }[];
  questions?: { id: string; prompt: string; options: string[]; answerIndex: number; xp: number; explain: string }[];
  questionText?: string;
  options?: { id: string; text: string }[];
  correctAnswerId?: string;
  explanation?: string;
  pairs?: { term: string; definition: string }[];
  url?: string;
};

type LessonType = {
  lessonId: string;
  title: string;
  xp: number;
  content: LessonContent[];
};

async function fetchLessonFromApi(lessonId: string): Promise<LessonType> {
  // Use fetchWithAuth for an authenticated API call
  const data = await fetchWithAuth(`https://skillsphere-backend-uur2.onrender.com/lesson/${lessonId}`);
  return data;
}

type MicroCardProps = {
  card: LessonContent;
  onChoose: (choice: any) => void;
  onNext: () => void;
};

function MicroCard({ card, onChoose, onNext }: MicroCardProps) {
  const [pressed, setPressed] = useState<string | null>(null);

  const handlePress = (choice: any) => {
    setPressed(choice.id);
    onChoose(choice);
  };
  
  const isInteractionCard = ['quiz', 'scenario', 'decision', 'match-pairs'].includes(card.type);
  
  if (isInteractionCard) {
      if (card.type === 'scenario') {
          return (
              <View style={styles.card}>
                  <Text style={styles.cardTitle}>Scenario</Text>
                  <Text style={styles.cardPrompt}>{card.text}</Text>
                  <View style={{ marginTop: 16 }}>
                      {card.choices?.map((c) => (
                          <TouchableOpacity 
                              key={c.id} 
                              style={[styles.choice, pressed === c.id && styles.choicePressed]}
                              onPress={() => handlePress(c)}>
                              <Text style={styles.choiceText}>{c.text}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>
              </View>
          );
      }
      if (card.type === 'quiz') {
          const q = card.questions?.[0];
          if (!q) return null;
          return (
              <View style={styles.card}>
                  <Text style={styles.cardTitle}>Quiz</Text>
                  <Text style={styles.cardPrompt}>{q.prompt}</Text>
                  <View style={{ marginTop: 16 }}>
                      {q.options.map((o, idx) => (
                          <TouchableOpacity 
                              key={o} 
                              style={[styles.choice, pressed === o && styles.choicePressed]} 
                              onPress={() => handlePress({ questionId: q.id, selectedIndex: idx, q, id: o })}>
                              <Text style={styles.choiceText}>{o}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>
              </View>
          );
      }
  }

  return (
    <View style={[styles.card, styles.infoCard]}>
      <Text style={styles.cardTitle}>{card.type === 'info' ? 'Info' : 'Image'}</Text>
      <Text style={styles.cardPrompt}>{card.text}</Text>
      {card.type === 'image' && card.url && <Image source={{ uri: card.url }} style={styles.image} />}
      <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
        <Text style={styles.nextBtnText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LessonScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { lessonId } = route.params;
  const [lesson, setLesson] = useState<LessonType | null>(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingLesson(true);
      try {
        if (lessonId) {
          const fetchedLesson = await fetchLessonFromApi(lessonId);
          if (fetchedLesson && mounted) {
            setLesson(fetchedLesson);
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.log('Could not load lesson:', e.message);
        } else {
          console.log('Could not load lesson:', e);
        }
      } finally {
        if (mounted) setLoadingLesson(false);
      }
    })();
    return () => { mounted = false; };
  }, [lessonId]);

  const handleAdvanceCard = () => {
    if (lesson) {
      setCurrentCardIndex(prevIndex => Math.min(prevIndex + 1, lesson.content.length - 1));
    }
  };
  
  const handleChoice = (choice: any) => {
    handleAdvanceCard();
  };

  if (loadingLesson || !lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }
  
  const currentCard = lesson.content[currentCardIndex];
  const isLastCard = currentCardIndex === lesson.content.length - 1;
  const isInteractionCard = ['quiz', 'scenario', 'decision', 'match-pairs'].includes(currentCard.type);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{lesson.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cardWrapper}>
        <MicroCard card={currentCard} onChoose={handleChoice} onNext={handleAdvanceCard} />
      </View>
      
      {!isLastCard && !isInteractionCard && (
        <TouchableOpacity style={styles.bottomNextBtn} onPress={handleAdvanceCard}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md },
  headerTitle: { fontWeight: '700', color: theme.colors.text },
  cardWrapper: { flex: 1, padding: theme.spacing.md },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, padding: theme.spacing.lg, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  infoCard: { justifyContent: 'space-between' },
  cardTitle: { fontSize: theme.typography.h2, fontWeight: '800', color: theme.colors.primary },
  cardPrompt: { marginTop: 12, color: theme.colors.text, fontSize: theme.typography.body, lineHeight: 22 },
  choice: { marginTop: 10, backgroundColor: theme.colors.surfaceVariant, padding: 14, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.outline },
  choicePressed: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, opacity: 0.8 },
  choiceText: { color: theme.colors.text, fontWeight: '600' },
  nextBtn: { backgroundColor: theme.colors.primary, padding: 14, borderRadius: theme.radii.md, marginTop: 'auto', alignItems: 'center' },
  bottomNextBtn: { backgroundColor: theme.colors.primary, padding: 20, borderRadius: theme.radii.md, margin: theme.spacing.md, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: 'bold', fontSize: theme.typography.body },
  image: { width: '100%', height: 200, marginTop: 16, borderRadius: theme.radii.md }
});