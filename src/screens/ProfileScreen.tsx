import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuth, signOut } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient'; // Needed for the fancy mentor button
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { theme } from '../lib/theme';
import { fetchWithAuth } from '../lib/api'; // Import from lib to avoid duplication

const auth = getAuth();

type UserProfile = {
  userId: string;
  totalXp: number;
  completedLessons: string[];
  currentStreak: number;
  lastActivityDate: string;
  name?: string;
  isMentor?: boolean; // New for Phase 3
};

type LessonTitleMap = {
  [key: string]: string;
};

// Fetch all lesson titles from the backend to map IDs to Names
async function fetchAllLessons(): Promise<LessonTitleMap> {
  const lessonTitles: LessonTitleMap = {};
  try {
    const topics = await fetchWithAuth('/topics');
    for (const topic of topics) {
      const lessons = await fetchWithAuth(`/lessons/${topic.id}`);
      for (const lesson of lessons) {
        lessonTitles[lesson.id] = lesson.title;
      }
    }
  } catch (error) {
    console.error("Error fetching lesson titles:", error);
  }
  return lessonTitles;
}

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { t, currentLanguage } = useLanguage();
  const [userProfileData, setUserProfileData] = useState<UserProfile | null>(null);
  const [lessonTitles, setLessonTitles] = useState<LessonTitleMap>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        // 1. Fetch Stats from Backend (Now includes isMentor)
        const profileData: UserProfile = await fetchWithAuth('/user-profile');
        
        // 2. Fetch Lesson Titles for mapping
        const allLessonTitles = await fetchAllLessons();
        
        // 3. Fetch Name directly from Firestore 'users' collection (Fallback)
        let fetchedUserName = profileData.name || 'Learner';
        if (auth.currentUser?.uid && !profileData.name) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            fetchedUserName = userDocSnap.data().name || auth.currentUser.displayName || 'User';
          }
        }
        
        setUserProfileData(profileData);
        setLessonTitles(allLessonTitles);
        setUserName(fetchedUserName);

      } catch (e) {
        console.error('Failed to fetch user profile:', e);
        Alert.alert('Error', 'Failed to fetch user profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [auth.currentUser]);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser || !userName) {
      Alert.alert('Error', 'User not logged in or name is empty.');
      return;
    }
    setIsEditing(false);
    try {
      // Update Name in Firestore
      await setDoc(doc(db, 'users', auth.currentUser.uid), { name: userName }, { merge: true });
      Alert.alert('Success', 'Profile updated!');
    } catch (e) {
      console.error('Failed to update profile:', e);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Reset navigation state
      nav.reset({ index: 0, routes: [{ name: 'Auth' }] });
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  if (loading || !userProfileData) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('user')}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={{ color: theme.colors.onPrimary, fontWeight: '600' }}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={userProfileData.completedLessons}
        keyExtractor={(item, index) => `${item}-${index}`}
        ListHeaderComponent={
          <View>
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarPlaceholder} />
              
              {/* Name Edit Logic */}
              {isEditing ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={userName}
                    onChangeText={setUserName}
                  />
                  <TouchableOpacity onPress={handleUpdateProfile}>
                    <Ionicons name="checkmark-circle-outline" size={30} color={theme.colors.success} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.editRow}>
                  <Text style={styles.userName}>{userName}</Text>
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Ionicons name="pencil-outline" size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              
              <Text style={styles.userEmail}>{auth.currentUser?.email || 'N/A'}</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{userProfileData.totalXp || 0}</Text>
                  <Text style={styles.statLabel}>{t('xp')}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>🔥 {userProfileData.currentStreak || 0}</Text>
                  <Text style={styles.statLabel}>{t('streak')}</Text>
                </View>
              </View>

              {/* --- PHASE 3: MENTORSHIP BUTTONS --- */}
              <View style={{ width: '100%', marginTop: 20 }}>
                {userProfileData.isMentor ? (
                  <TouchableOpacity 
                    style={styles.mentorBtn} 
                    onPress={() => nav.navigate('MentorDashboard')}
                  >
                    <LinearGradient colors={[theme.colors.secondary, theme.colors.primary]} style={styles.gradientBtn}>
                      <Ionicons name="briefcase" size={20} color="#fff" />
                      <Text style={styles.mentorBtnText}>Mentor Dashboard</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.applyBtn} 
                    onPress={() => nav.navigate('Become a Mentor')} // Points to ApplyMentorScreen via Drawer or Stack
                  >
                    <Text style={styles.applyText}>Become a Mentor</Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* ----------------------------------- */}

            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('completedLessons')}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Text style={styles.completedLessonText}>- {lessonTitles[item] || item}</Text>
        )}
        ListFooterComponent={
          <View style={[styles.section, styles.languageSection]}>
            <Text style={styles.sectionTitle}>{t('currentLanguageLabel')}: {currentLanguage.toUpperCase()}</Text>
            <TouchableOpacity style={styles.languageButton} onPress={() => nav.navigate('LanguageSelect')}>
              <Text style={styles.languageButtonText}>{t('changeLanguage')}</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
            <Text style={{color: theme.colors.muted, textAlign: 'center', marginTop: 10}}>No lessons completed yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  title: { fontSize: theme.typography.h1, fontWeight: '800' },
  logoutBtn: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, borderRadius: theme.radii.sm, backgroundColor: theme.colors.error },
  profileCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.lg, borderRadius: theme.radii.lg, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.surfaceVariant, marginBottom: theme.spacing.md, borderWidth: 2, borderColor: theme.colors.secondary },
  editRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs },
  nameInput: { fontSize: theme.typography.h2, fontWeight: '800', textAlign: 'center', color: theme.colors.text, paddingHorizontal: theme.spacing.sm, borderBottomWidth: 1, borderColor: theme.colors.outline },
  userName: { fontSize: theme.typography.h2, fontWeight: '800', textAlign: 'center', color: theme.colors.text, paddingHorizontal: theme.spacing.sm },
  userEmail: { color: theme.colors.muted, fontSize: theme.typography.small, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: theme.spacing.lg },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: theme.typography.h1, fontWeight: '800', color: theme.colors.primary },
  statLabel: { color: theme.colors.muted, marginTop: 4, fontSize: theme.typography.small },
  section: { marginTop: theme.spacing.lg },
  sectionTitle: { fontSize: theme.typography.h2, fontWeight: '800', marginBottom: theme.spacing.md },
  completedLessonText: { fontSize: theme.typography.body, color: theme.colors.text, marginTop: theme.spacing.sm, paddingHorizontal: theme.spacing.md },
  languageSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 30,
    paddingBottom: 20
  },
  languageButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primary,
  },
  languageButtonText: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
  
  // Mentor Button Styles
  mentorBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  gradientBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16 },
  mentorBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  applyBtn: { borderWidth: 1, borderColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  applyText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }
});