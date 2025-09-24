import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../lib/firebase';
import { theme } from '../lib/theme';

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
    throw new Error('API request failed.');
  }
  return response.json();
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
};

function AssessmentView({ assessment, onSubmit, assessmentResult }: AssessmentViewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelectOption = (questionId: string, selectedOptionId: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: selectedOptionId }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== assessment.questions.length) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
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
        <Text style={styles.assessmentResultTitle}>Assessment Complete!</Text>
        <Text style={styles.assessmentResultText}>Status: {assessmentResult.status}</Text>
        <Text style={styles.assessmentResultText}>Score: {assessmentResult.score}%</Text>
        <Text style={styles.assessmentResultText}>XP Earned: {assessmentResult.xpEarned}</Text>

        {assessmentResult.status === 'passed' && assessmentResult.nextLessonId && (
          <TouchableOpacity 
            style={styles.nextLessonButton} 
            onPress={() => console.log('Navigating to next lesson:', assessmentResult.nextLessonId)}
          >
            <Text style={styles.nextLessonButtonText}>Next Lesson</Text>
          </TouchableOpacity>
        )}

        {assessmentResult.status === 'requires_review' && assessmentResult.remedialLesson && (
          <View style={styles.remedialCard}>
            <Text style={styles.remedialTitle}>Remedial Lesson</Text>
            <Text style={styles.remedialText}>{assessmentResult.remedialLesson.title}</Text>
            <TouchableOpacity 
              style={styles.reviewButton} 
              onPress={() => console.log('Starting remedial lesson:', assessmentResult.remedialLesson)}
            >
              <Text style={styles.reviewButtonText}>Review</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.assessmentContainer}>
      <Text style={styles.assessmentTitle}>Assessment</Text>
      <FlatList
        data={assessment.questions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{item.questionText}</Text>
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
                <Text style={styles.optionText}>{option.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
      {!submitted && (
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Submit Assessment</Text>
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

  const handleNextContent = () => {
    if (!lesson || contentIndex >= lesson.content.length) {
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
      Alert.alert('Error', 'Failed to submit assessment.');
    }
  };

  const handleNextLesson = () => {
    if (assessmentResult?.status === 'passed' && assessmentResult.nextLessonId) {
      nav.navigate('Lesson', { lessonData: { id: assessmentResult.nextLessonId } });
    }
    if (assessmentResult?.status === 'requires_review' && assessmentResult.remedialLesson) {
        // Here, you could set the lesson state to the remedial lesson
        // setLesson({ ...lesson, content: assessmentResult.remedialLesson.content });
        // Or you can create a new RemedialLessonScreen
        console.log('Starting remedial lesson');
    }
  };

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Lesson data not found. Please go back and try again.</Text>
      </SafeAreaView>
    );
  }

  const showAssessment = contentIndex >= lesson.content.length;
  const isLastContentBlock = contentIndex === lesson.content.length - 1;
  const currentContent = lesson.content[contentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={{ paddingRight: 10 }}>
          <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: theme.typography.body }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{lesson.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {showAssessment ? (
        <AssessmentView assessment={lesson.assessment} onSubmit={handleSubmitAssessment} assessmentResult={assessmentResult} />
      ) : (
        <View style={styles.contentContainer}>
          <View style={styles.contentCard}>
            {currentContent && currentContent.type === 'paragraph' && (
              <Text style={styles.paragraphText}>{currentContent.text}</Text>
            )}
            {/* Add more content types here */}
          </View>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNextContent}>
            <Text style={styles.nextBtnText}>{isLastContentBlock ? 'Start Assessment' : 'Next'}</Text>
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