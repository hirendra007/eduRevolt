/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { auth } from '../lib/firebase';
import { translateLesson } from '../lib/language';
import { theme } from '../lib/theme';
import { useTTS } from '../lib/tts';

type LessonContent = {
  type: 'paragraph' | 'image' | 'quiz';
  text?: string;
  url?: string;
  questionText?: string;
  quizType?: string;
  options?: { id: string; text: string }[];
  correctAnswerId?: string;
  explanation?: string;
};

type AssessmentQuestion = {
  id: string;
  questionText: string;
  quizType: string;
  options: { id: string; text: string }[];
  correctAnswerId: string;
};

type LessonType = {
  id: string;
  title: string;
  xp: number;
  content: LessonContent[];
  assessment: {
    passingScore: number;
    questions: AssessmentQuestion[];
  };
};

type AssessmentResponse = {
  status: 'passed' | 'requires_review';
  score: number;
  xpEarned: number;
  nextLessonId?: string;
  remedialLesson?: {
    title: string;
    estimatedMinutes: number;
    difficulty: string;
    content: LessonContent[];
  };
};

type LessonRouteParams = {
  lessonData: LessonType;
};

type LessonScreenRouteProp = RouteProp<{ Lesson: LessonRouteParams }, 'Lesson'>;

async function fetchWithAuth(url: string, method = 'GET', body?: object) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated.');
  }
  const idToken = await user.getIdToken();
  const response = await fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    let details = '';
    try {
      details = await response.text();
    } catch {}
    throw new Error(`API request failed. ${response.status} ${response.statusText}${details ? ' - ' + details : ''}`);
  }
  return response.json();
}

async function fetchLessonById(lessonId: string): Promise<LessonType> {
  const base = 'https://skillsphere-backend-uur2.onrender.com';
  const candidates = [
    `${base}/lessons/${lessonId}`,
    `${base}/lesson/${lessonId}`,
  ];
  let lastError: unknown = null;
  for (const url of candidates) {
    try {
      const data = await fetchWithAuth(url);
      return data as LessonType;
    } catch (e) {
      lastError = e;
      // try next
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Failed to fetch lesson by ID');
}

type Answer = { questionId: string; selectedOptionId: string };

async function submitAssessment(lessonId: string, answers: Answer[]): Promise<AssessmentResponse> {
  const data = await fetchWithAuth(
    `https://skillsphere-backend-uur2.onrender.com/assessments/${lessonId}/submit`,
    'POST',
    { answers }
  );
  return data;
}

type AssessmentViewProps = {
  assessment: LessonType['assessment'];
  onSubmit: (answers: Answer[]) => Promise<void>;
  assessmentResult: AssessmentResponse | null;
  onNextLesson?: () => void;
};

function AssessmentView({ assessment, onSubmit, assessmentResult, onNextLesson }: AssessmentViewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const { t, languageConfig } = useLanguage();

  const handleSelectOption = (questionId: string, selectedOptionId: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: selectedOptionId }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== assessment.questions.length) {
      Alert.alert(t('incomplete'), t('answerAllQuestions'));
      return;
    }
    setSubmitted(true);
    const formattedAnswers: Answer[] = Object.keys(answers).map(questionId => ({
      questionId,
      selectedOptionId: answers[questionId],
    }));
    await onSubmit(formattedAnswers);
  };

  if (assessmentResult) {
    return (
      <View style={styles.assessmentResultContainer}>
        <Text style={[styles.assessmentResultTitle, { fontSize: languageConfig.fontSize.h1 }]}>{t('assessmentComplete')}</Text>
        <Text style={[styles.assessmentResultText, { fontSize: languageConfig.fontSize.body }]}>{t('status')}: {assessmentResult.status}</Text>
        <Text style={[styles.assessmentResultText, { fontSize: languageConfig.fontSize.body }]}>{t('score')}: {assessmentResult.score}%</Text>
        <Text style={[styles.assessmentResultText, { fontSize: languageConfig.fontSize.body }]}>{t('xpEarned')}: {assessmentResult.xpEarned}</Text>

        {assessmentResult.status === 'passed' && assessmentResult.nextLessonId && (
          <TouchableOpacity
            style={styles.nextLessonButton}
            onPress={onNextLesson}
          >
            <Text style={[styles.nextLessonButtonText, { fontSize: languageConfig.fontSize.body }]}>{t('nextLesson')}</Text>
          </TouchableOpacity>
        )}

        {assessmentResult.status === 'requires_review' && assessmentResult.remedialLesson && (
          <View style={styles.remedialCard}>
            <Text style={[styles.remedialTitle, { fontSize: languageConfig.fontSize.h2 }]}>{t('remedialLesson')}</Text>
            <Text style={[styles.remedialText, { fontSize: languageConfig.fontSize.body }]}>{assessmentResult.remedialLesson.title}</Text>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => console.log('Starting remedial lesson:', assessmentResult.remedialLesson)}
            >
              <Text style={[styles.reviewButtonText, { fontSize: languageConfig.fontSize.body }]}>{t('review')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.assessmentContainer}>
      <Text style={[styles.assessmentTitle, { fontSize: languageConfig.fontSize.h1 }]}>{t('assessment')}</Text>
      <FlatList
        data={assessment.questions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.questionCard}>
            <Text style={[styles.questionText, { fontSize: languageConfig.fontSize.body }]}>{item.questionText}</Text>
            {item.options.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  answers[item.id] === option.id && styles.optionSelected,
                  submitted && answers[item.id] === item.correctAnswerId && styles.optionCorrect,
                  submitted && answers[item.id] === option.id && answers[item.id] !== item.correctAnswerId && styles.optionIncorrect,
                ]}
                onPress={() => handleSelectOption(item.id, option.id)}
              >
                <Text style={[styles.optionText, { fontSize: languageConfig.fontSize.body }]}>{option.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
      {!submitted && (
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={[styles.submitBtnText, { fontSize: languageConfig.fontSize.body }]}>{t('submitAssessment')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function LessonScreen() {
  const route = useRoute<LessonScreenRouteProp>();
  const nav = useNavigation<any>();
  const { lessonData } = route.params;
  const [lesson, setLesson] = useState<LessonType | null>(lessonData);
  const [contentIndex, setContentIndex] = useState(0);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState<boolean>(!('content' in (lessonData as any)));
  const [lessonError, setLessonError] = useState<string | null>(null);
  const { t, languageConfig, currentLanguage } = useLanguage();
  const { speak, stop, isPlaying: ttsIsPlaying } = useTTS();

  useEffect(() => {
    (async () => {
      try {
        if (lesson && (!lesson.content || lesson.content.length === 0 || !lesson.assessment)) {
          setLoadingLesson(true);
          setLessonError(null);
          const fullLesson = await fetchLessonById(lesson.id);
          const localized = await translateLesson(fullLesson, currentLanguage);
          setLesson(localized);
        }
      } catch (e) {
        console.log('Failed to load lesson details', e);
        setLessonError(e instanceof Error ? e.message : 'Failed to load lesson');
      } finally {
        setLoadingLesson(false);
      }
    })();
  }, [lesson?.id, currentLanguage]);

  const handleNextContent = () => {
    if (!lesson || !lesson.content || contentIndex >= lesson.content.length) {
      return;
    }
    setContentIndex(contentIndex + 1);
  };

  const handleSubmitAssessment = async (answers: Answer[]) => {
    try {
      if (lesson) {
        const result = await submitAssessment(lesson.id, answers);
        setAssessmentResult(result);
      }
    } catch (e) {
      Alert.alert(t('error'), t('submitAssessment'));
    }
  };

  const handlePlayAudio = async (text: string) => {
    if (isPlaying) {
      stop();
      setIsPlaying(false);
    } else {
      await speak(text, currentLanguage);
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 100);
    }
  };


  const handleNextLesson = async () => {
    if (assessmentResult?.status === 'passed' && assessmentResult.nextLessonId) {
      try {
        const nextLessonData = await fetchLessonById(assessmentResult.nextLessonId);
        const localized = await translateLesson(nextLessonData, currentLanguage);
        // push to create a new instance and avoid staying on the same screen data
        nav.push('Lesson', { lessonData: localized });
      } catch (err) {
        console.log('Error fetching next lesson', err);
        Alert.alert(t('error'), t('failedToLoadNextLesson'));
      }
    }
    if (assessmentResult?.status === 'requires_review' && assessmentResult.remedialLesson) {
        // Here, you could set the lesson state to the remedial lesson
        // setLesson({ ...lesson, content: assessmentResult.remedialLesson.content });
        // Or you can create a new RemedialLessonScreen
        console.log('Starting remedial lesson');
    }
  };


  if (loadingLesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={{ color: theme.colors.muted, marginTop: 12 }}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson || !lesson.content) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={[styles.errorText, { fontSize: languageConfig.fontSize.body }]}>
          {lessonError || t('lessonNotFound')}
        </Text>
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <TouchableOpacity onPress={() => nav.goBack()} style={[styles.nextBtn, { paddingHorizontal: 20 }]}>
            <Text style={styles.nextBtnText}>{t('back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const contentLength = lesson.content?.length ?? 0;
  const showAssessment = contentIndex >= contentLength;
  const isLastContentBlock = contentIndex === contentLength - 1;
  const currentContent = lesson.content?.[contentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={{ paddingRight: 10 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: languageConfig.fontSize.body }}>‹ {t('back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: languageConfig.fontSize.h1 }]}>{lesson.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {showAssessment ? (
        <AssessmentView assessment={lesson.assessment} onSubmit={handleSubmitAssessment} assessmentResult={assessmentResult} onNextLesson={handleNextLesson} />
      ) : (
        <View style={styles.contentContainer}>
          <View style={styles.contentCard}>
            {currentContent && currentContent.type === 'paragraph' && (
              <>
                <Text style={[styles.paragraphText, { fontSize: languageConfig.fontSize.body, fontFamily: languageConfig.fontFamily }]}>
                  {currentContent.text}
                </Text>
                <TouchableOpacity style={styles.audioButton} onPress={() => handlePlayAudio(currentContent.text || '')}>
                  <Ionicons name={isPlaying ? 'stop-circle' : 'play-circle'} size={32} color={theme.colors.primary} />
                  <Text style={[styles.audioButtonText, { fontSize: languageConfig.fontSize.small }]}>
                    {isPlaying ? t('stopAudio') : t('playAudio')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {/* Add more content types here */}
          </View>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNextContent}>
            <Text style={[styles.nextBtnText, { fontSize: languageConfig.fontSize.body }]}>
              {isLastContentBlock ? t('startAssessment') : t('next')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
  
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.lg, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: theme.typography.h1, fontWeight: '800', color: theme.colors.text },
  contentContainer: { flex: 1, padding: theme.spacing.lg, justifyContent: 'space-between' },
  contentCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, padding: theme.spacing.lg },
  paragraphText: { fontSize: theme.typography.body, lineHeight: 24, color: theme.colors.text },
  audioButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: theme.spacing.md },
  audioButtonText: { color: theme.colors.primary, marginLeft: 8 },
  nextBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.radii.md, alignItems: 'center' },
  nextBtnText: { color: 'white', fontWeight: 'bold' },
  
  // Assessment Styles
  assessmentContainer: { flex: 1, padding: theme.spacing.lg },
  assessmentTitle: { fontSize: theme.typography.h1, fontWeight: 'bold', marginBottom: theme.spacing.md },
  questionCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.md, padding: theme.spacing.md, marginBottom: theme.spacing.md },
  questionText: { fontSize: theme.typography.body, fontWeight: 'bold', marginBottom: theme.spacing.sm },
  optionButton: { backgroundColor: theme.colors.surfaceVariant, padding: theme.spacing.sm, borderRadius: theme.radii.sm, marginBottom: theme.spacing.xs, borderWidth: 1, borderColor: theme.colors.outline },
  optionSelected: { borderColor: theme.colors.primary, borderWidth: 2 },
  optionCorrect: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  optionIncorrect: { backgroundColor: theme.colors.error, borderColor: theme.colors.error },
  optionText: { fontSize: theme.typography.body, color: theme.colors.text },
  submitBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.radii.md, alignItems: 'center', marginTop: theme.spacing.md },
  submitBtnText: { color: 'white', fontWeight: 'bold' },
  
  // New Assessment Result Styles
  assessmentResultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
  assessmentResultTitle: { fontSize: theme.typography.h1, fontWeight: 'bold', marginBottom: theme.spacing.md },
  assessmentResultText: { fontSize: theme.typography.body, color: theme.colors.text, marginBottom: theme.spacing.xs },
  nextLessonButton: { backgroundColor: theme.colors.success, padding: theme.spacing.md, borderRadius: theme.radii.md, marginTop: theme.spacing.lg },
  nextLessonButtonText: { color: 'white', fontWeight: 'bold' },
  remedialCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.lg, borderRadius: theme.radii.lg, marginTop: theme.spacing.lg, alignItems: 'center' },
  remedialTitle: { fontSize: theme.typography.h2, fontWeight: 'bold', color: theme.colors.error, marginBottom: theme.spacing.sm },
  remedialText: { textAlign: 'center', marginBottom: theme.spacing.md },
  reviewButton: { backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.radii.md },
  reviewButtonText: { color: 'white', fontWeight: 'bold' },
  errorText: { color: theme.colors.error, textAlign: 'center', marginTop: 20 },
});