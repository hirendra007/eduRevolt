import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';

const auth = getAuth();
const db = getFirestore();

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { t, currentLanguage } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserData(data);
          setTempName(data.name || '');
        } else {
          setUserData({
            name: currentUser.displayName,
            email: currentUser.email,
            points: 0,
            streakDays: 0,
            badges: []
          });
          setTempName(currentUser.displayName || '');
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateProfile = async () => {
    if (!user || !tempName) {
      Alert.alert('Error', 'User not logged in or name is empty.');
      return;
    }
    setIsEditing(false);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { name: tempName }, { merge: true });
      setUserData((prev: any) => ({ ...prev, name: tempName }));
      Alert.alert('Success', 'Profile updated!');
    } catch (e) {
      console.error('Failed to update profile:', e);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      nav.reset({ index: 0, routes: [{ name: 'Auth' }] });
    } catch (e) {
      console.error('Logout failed:', e);
      Alert.alert('Logout Failed', 'Please try again.');
    }
  };

  if (loading) {
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
          <Text style={{ color: theme.colors.muted, fontWeight: '600' }}>{t('submit')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarPlaceholder} />
        {isEditing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={tempName}
              onChangeText={setTempName}
            />
            <TouchableOpacity onPress={handleUpdateProfile}>
              <Ionicons name="checkmark-circle-outline" size={30} color={theme.colors.success} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.editRow}>
            <Text style={styles.userName}>{userData?.name || t('user')}</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.userEmail}>{userData?.email || 'N/A'}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{userData?.points || 0}</Text>
            <Text style={styles.statLabel}>{t('xp')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>🔥 {userData?.streakDays || 0}</Text>
            <Text style={styles.statLabel}>{t('streak')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('badges')}</Text>
        <View style={{ flexDirection: 'row', paddingTop: 8, flexWrap: 'wrap' }}>
          {userData?.badges?.map((b: string) => (
            <View key={b} style={styles.badge}>
              <Text style={{ color: theme.colors.text, fontSize: theme.typography.small }}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={styles.sectionTitle}>{t('currentLanguageLabel')}: {currentLanguage.toUpperCase()}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => nav.navigate('LanguageSelect') as any}>
          <Text style={{ color: theme.colors.muted, fontWeight: '600' }}>{t('changeLanguage')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  title: { fontSize: theme.typography.h1, fontWeight: '800' },
  logoutBtn: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, borderRadius: theme.radii.sm, backgroundColor: theme.colors.surfaceVariant },
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
  badge: { backgroundColor: theme.colors.chip, padding: theme.spacing.sm, borderRadius: theme.radii.md, marginRight: theme.spacing.sm, marginBottom: theme.spacing.sm }
});