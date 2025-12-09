import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../lib/firebase';
import { theme } from '../lib/theme';

type LeaderboardEntry = {
  rank: number;
  uid: string;
  xp: number;
  name?: string; 
};

// Reusable fetchWithAuth function
async function fetchWithAuth(url: string) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated.');
  }
  const idToken = await user.getIdToken();
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('API request failed.');
  }
  return response.json();
}

// Function to fetch user names from the 'users' collection
async function fetchUserNames(uids: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  
  // Create an array of promises to fetch user data in parallel
  const userPromises = uids.map(async (uid) => {
    // Check if uid is valid before fetching
    if (typeof uid === 'string' && uid) {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid)); // Updated collection to 'users'
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.name) {
            names.set(uid, userData.name);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch name for user ${uid}`, error);
      }
    }
  });

  await Promise.all(userPromises);
  return names;
}

async function fetchLeaderboardData(): Promise<LeaderboardEntry[]> {
  try {
    const data: any[] = await fetchWithAuth('https://skillbridge-backend-2-gq5c.onrender.com/leaderboard');
    
    if (!Array.isArray(data)) {
        console.error("Leaderboard data is not an array:", data);
        return [];
    }

    // Get all UIDs from the leaderboard data, filtering out any invalid entries
    const uids = data
        .filter(entry => entry && entry.uid)
        .map(entry => entry.uid);

    // Fetch user names from Firestore
    const userNames = await fetchUserNames(uids);

    // Map the names to the leaderboard data
    return data.map(entry => ({ 
      rank: entry.rank,
      uid: entry.uid,
      xp: entry.xp,
      name: userNames.get(entry.uid) || `User ${entry.uid ? entry.uid.substring(0, 4) : 'Unknown'}` 
    }));
  } catch (error) {
    console.error("Error in fetchLeaderboardData:", error);
    return [];
  }
}

export default function LeaderboardScreen() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const fetchedData = await fetchLeaderboardData();
        if (isMounted) {
          setLeaderboardData(fetchedData);
        }
      } catch (e) {
        console.error('Failed to fetch leaderboard:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 20 }} color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Leaderboard</Text></View>
      <FlatList
        data={leaderboardData}
        keyExtractor={i => i.uid || Math.random().toString()} // Fallback key
        contentContainerStyle={{ padding: theme.spacing.md }}
        renderItem={({ item, index }) => (
          <View style={[styles.row, index === 0 && styles.firstPlace]}>
            <Text style={styles.rank}>{item.rank}</Text>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.points}>{item.xp} XP</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.lg },
  title: { fontSize: theme.typography.h1, fontWeight: '800', color: theme.colors.text },
  row: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.sm, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.sm, borderRadius: theme.radii.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  firstPlace: { borderColor: theme.colors.secondary, borderWidth: 2, transform: [{ scale: 1.05 }] },
  rank: { width: 40, fontWeight: '700', fontSize: theme.typography.h2, color: theme.colors.primary, textAlign: 'center' },
  name: { fontWeight: '700', fontSize: theme.typography.body },
  points: { color: theme.colors.muted, fontSize: theme.typography.small }
});