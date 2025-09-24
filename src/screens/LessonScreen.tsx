import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FeedbackModal from '../components/FeedbackModal';
import { callGradeQuiz } from '../lib/api';
import { db } from '../lib/firebase';
import { theme } from '../lib/theme';

const { width } = Dimensions.get('window');

const mockLesson = {
  lessonId: 'finance_salary_001',
  title: 'First Salary: Basic Budget',
  xp: 40,
  content: [
    { type: 'scenario', id: 's1', prompt: 'You receive your first salary ₹30,000. Rent ₹8,000, family needs ₹7,000. What do you do?', choices: [
      { id: 'c1', text: 'Save 20%, invest 10%, spend rest', xp: 10, explain: 'Good start: split income into saving and investment.' },
      { id: 'c2', text: 'Spend 90% now', xp: 0, explain: 'Risky: no savings for emergencies.' }
    ]},
    { type: 'info', id: 'i1', text: 'Emergency fund is 3–6 months of essential expenses.' },
    { type: 'quiz', id: 'q1', questions: [{ id: 'q1_1', prompt: 'What is an emergency fund?', options: ['Money for daily needs','Money for unexpected events','Investment'], answerIndex: 1, xp: 10, explain: 'Emergency fund covers unexpected events.' }]}
  ]
};

function MicroCard({ card, onChoose }: any) {
  if (card.type === 'scenario') {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scenario</Text>
        <Text style={styles.cardPrompt}>{card.prompt}</Text>
        <View style={{ marginTop: 16 }}>
          {card.choices.map((c: any) => (
            <TouchableOpacity key={c.id} style={styles.choice} onPress={() => onChoose(c)}>
              <Text style={styles.choiceText}>{c.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }
  if (card.type === 'info') {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tip</Text>
        <Text style={styles.cardPrompt}>{card.text}</Text>
      </View>
    );
  }
  if (card.type === 'quiz') {
    const q = card.questions[0];
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quiz</Text>
        <Text style={styles.cardPrompt}>{q.prompt}</Text>
        <View style={{ marginTop: 16 }}>
          {q.options.map((o: any, idx: number) => (
            <TouchableOpacity key={o} style={styles.choice} onPress={() => onChoose({ questionId: q.id, selectedIndex: idx, q })}>
              <Text style={styles.choiceText}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }
  return null;
}

export default function LessonScreen() {
  const route = useRoute();
  const nav = useNavigation();
  // @ts-ignore
  const lessonId = route.params?.lessonId || mockLesson.lessonId;
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const [modal, setModal] = useState<{ visible: boolean; title?: string; subtitle?: string; xp?: number }>({ visible: false });
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);
  const [lesson, setLesson] = useState<any>(mockLesson);
  const [loadingLesson, setLoadingLesson] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingLesson(true);
      try {
        const snap = await getDoc(doc(db, 'lessons', lessonId));
        if (snap.exists() && mounted) {
          const data = snap.data();
          // basic validation fallback
          if (data && Array.isArray(data.content)) setLesson({ ...data, lessonId: snap.id });
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.log('Could not load lesson from Firestore, using fallback', e.message);
        } else {
          console.log('Could not load lesson from Firestore, using fallback', e);
        }
      } finally {
        if (mounted) setLoadingLesson(false);
      }
    })();
    return () => { mounted = false; };
  }, [lessonId]);

  const handleScenarioChoice = async (choice: any) => {
    // Show modal and award XP; move to next
    setModal({ visible: true, title: choice.explain, subtitle: choice.text, xp: choice.xp });
  };

  const handleQuizChoice = async (payload: any) => {
    // payload: { questionId, selectedIndex, q }
    // Save locally then grade when finished
    setQuizAnswers(prev => [...prev, { questionId: payload.questionId, selectedIndex: payload.selectedIndex }]);
    // Immediate feedback
    const correct = payload.selectedIndex === payload.q.answerIndex;
    setModal({ visible: true, title: correct ? 'Correct!' : 'Not quite', subtitle: payload.q.explain, xp: correct ? payload.q.xp : 0 });
  };

  const closeModal = async () => {
    setModal({ visible: false });
    // Advance to next card
    const contentLength = lesson?.content?.length || mockLesson.content.length;
    const next = Math.min(index + 1, contentLength - 1);
    setIndex(next);
    listRef.current?.scrollToIndex({ index: next });

    // If we just finished the last card and there were quiz answers, grade them
    if (next === (lesson?.content?.length || mockLesson.content.length) - 1 && quizAnswers.length > 0) {
      try {
        const quizCard = (lesson?.content || mockLesson.content).find((c: any) => c.type === 'quiz');
        const res: any = await callGradeQuiz({ quiz: quizCard, answers: quizAnswers });
        // Persist progress to Firestore if possible
        try {
          // Use auth.uid when available; for demo we keep demo_user
          const userId = 'demo_user';
          await setDoc(doc(db, 'progress', `${userId}_${lessonId}`), {
            userId,
            lessonId,
            completed: true,
            score: Math.round((res.earned / res.total) * 100),
            xpEarned: res.earned,
            attempts: 1,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (e: unknown) {
          if (e instanceof Error) {
            console.log('Could not persist progress', e.message);
          } else {
            console.log('Could not persist progress', e);
          }
        }
        // Show final result (simple alert for now)
        Alert.alert('Lesson complete', `You earned ${res.earned} / ${res.total} XP`);
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.log('Grading failed', e.message);
        } else {
          console.log('Grading failed', e);
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={{ color: theme.colors.primary }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{lesson.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={listRef}
        data={lesson.content}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <View style={{ width }}><MicroCard card={item} onChoose={item.type === 'quiz' ? handleQuizChoice : handleScenarioChoice} /></View>}
        ListEmptyComponent={<View style={{ width, padding: 24 }}><Text style={{ color: theme.colors.muted }}>Loading lesson...</Text></View>}
      />

      <FeedbackModal visible={modal.visible} onClose={closeModal} title={modal.title} subtitle={modal.subtitle} xp={modal.xp} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md },
  headerTitle: { fontWeight: '700', color: theme.colors.text },
  card: { marginTop: 16, marginHorizontal: 12, backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, padding: theme.spacing.md, minHeight: 300, justifyContent: 'flex-start' },
  cardTitle: { fontSize: theme.typography.h2, fontWeight: '800', color: theme.colors.text },
  cardPrompt: { marginTop: 12, color: theme.colors.muted },
  choice: { marginTop: 10, backgroundColor: theme.colors.surfaceVariant, padding: 12, borderRadius: theme.radii.md },
  choiceText: { color: theme.colors.text }
});