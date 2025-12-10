import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { auth } from '../lib/firebase';
import { theme } from '../lib/theme';

// --- Screen Imports ---
import AuthScreen from '../screens/AuthScreen';
import CommunityScreen from '../screens/Community/CommunityScreen';
import PostDetailScreen from '../screens/Community/PostDetailScreen';
import HomeScreen from '../screens/HomeScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import LeaderboardScreen from '../screens/LeaderBoardScreen';
import LessonScreen from '../screens/LessonScreen';
import LessonsListScreen from '../screens/LessonsListScreen';
import MentorListScreen from '../screens/Mentorship/MentorListScreen';
import InterestSelectionScreen from '../screens/Onboarding/InterestSelectionScreen';
import TopicResourcesScreen from '../screens/TopicResourcesScreen';
import TopicScreen from '../screens/TopicScreen';

// --- Sidebar & Mentorship Imports ---
import ApplyMentorScreen from '../screens/Mentorship/ApplyMentorScreen';
import ChatScreen from '../screens/Mentorship/ChatScreen';
import MentorDashboardScreen from '../screens/Mentorship/MentorDashboardScreen';
import StudentRequestsScreen from '../screens/Mentorship/StudentRequestsScreen';
import UploadContentScreen from '../screens/Mentorship/UploadContentScreen';
import MyCoursesScreen from '../screens/MyCoursesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const HomeStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
const MentorshipStack = createNativeStackNavigator(); 

// 1. Home Stack
function HomeStackNavigator() {
 return (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
   <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
   <HomeStack.Screen name="Lessons" component={LessonsListScreen} />
   <HomeStack.Screen name="Lesson" component={LessonScreen} />
   <HomeStack.Screen name="Community" component={CommunityScreen} />
   <HomeStack.Screen name="PostDetail" component={PostDetailScreen} />
   <HomeStack.Screen name="MentorList" component={MentorListScreen} />
   <HomeStack.Screen name="TopicResources" component={TopicResourcesScreen} />
  </HomeStack.Navigator>
 );
}

// 2. Explore Stack
function ExploreStackNavigator() {
 return (
  <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
   <ExploreStack.Screen name="TopicScreen" component={TopicScreen} />
   <ExploreStack.Screen name="Lessons" component={LessonsListScreen} />
   <ExploreStack.Screen name="Lesson" component={LessonScreen} />
   <ExploreStack.Screen name="Community" component={CommunityScreen} />
   <ExploreStack.Screen name="PostDetail" component={PostDetailScreen} />
   <ExploreStack.Screen name="MentorList" component={MentorListScreen} />
   <ExploreStack.Screen name="TopicResources" component={TopicResourcesScreen} />
  </ExploreStack.Navigator>
 );
}

// 3. Mentorship Stack
function MentorshipStackNavigator() {
 return (
  <MentorshipStack.Navigator screenOptions={{ headerShown: false }}>
   <MentorshipStack.Screen 
    name="FindMentorTopics" 
    component={TopicScreen} 
    initialParams={{ mode: 'mentorship' }}
   />
   <MentorshipStack.Screen name="MentorList" component={MentorListScreen} />
  </MentorshipStack.Navigator>
 );
}

// 4. Main Tabs
function MainTabs({ navigation }: any) {
 return (
  <Tabs.Navigator
   screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.muted,
    tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline },
    tabBarIcon: ({ color, size }) => {
     let name;
     if (route.name === 'Home') name = 'home';
     if (route.name === 'Explore') name = 'grid';
     if (route.name === 'Leaderboard') name = 'trophy';
     if (route.name === 'Others') name = 'menu';
     return <Ionicons name={name as any} size={size} color={color} />;
    },
   })}
  >
   <Tabs.Screen name="Home" component={HomeStackNavigator} />
   <Tabs.Screen name="Explore" component={ExploreStackNavigator} />
   <Tabs.Screen name="Leaderboard" component={LeaderboardScreen} />
   <Tabs.Screen 
    name="Others" 
    component={View} 
    listeners={{
     tabPress: (e) => {
      e.preventDefault();
      navigation.openDrawer();
     },
    }}
   />
  </Tabs.Navigator>
 );
}

// 5. Drawer Navigator
function DrawerRoot() {
 return (
  <Drawer.Navigator 
   screenOptions={{ 
    headerShown: false,
    drawerActiveTintColor: theme.colors.primary,
    drawerInactiveTintColor: theme.colors.text,
        // FIX: Adjusting the label margin to pull it closer to the icon, and refining item style.
    drawerLabelStyle: { fontWeight: '600', marginLeft: -12 }, 
        drawerItemStyle: { marginVertical: 4, paddingHorizontal: 10 },
   }}
  >
   <Drawer.Screen 
    name="Dashboard" 
    component={MainTabs} 
    options={{
     drawerIcon: ({color}) => <Ionicons name="home-outline" size={22} color={color} />
    }} 
   />
   <Drawer.Screen 
    name="My Learning" 
    component={MyCoursesScreen} 
    options={{
     drawerIcon: ({color}) => <Ionicons name="book-outline" size={22} color={color} />
    }} 
   />
   <Drawer.Screen 
    name="My Requests" 
    component={StudentRequestsScreen} 
    options={{ 
     drawerIcon: ({color}) => <Ionicons name="paper-plane-outline" size={22} color={color} /> 
    }} 
   />
   <Drawer.Screen 
    name="Find a Mentor" 
    component={MentorshipStackNavigator} 
    options={{ drawerIcon: ({color}) => <Ionicons name="search-outline" size={22} color={color} /> }} 
   />
   <Drawer.Screen 
    name="Profile" 
    component={ProfileScreen} 
    options={{
     drawerIcon: ({color}) => <Ionicons name="person-outline" size={22} color={color} />
    }} 
   />
   <Drawer.Screen 
    name="Mentor Dashboard" 
    component={MentorDashboardScreen} 
    options={{
     drawerIcon: ({color}) => <Ionicons name="briefcase-outline" size={22} color={color} />
    }} 
   />
   <Drawer.Screen 
    name="Become a Mentor" 
    component={ApplyMentorScreen} 
    options={{
     drawerIcon: ({color}) => <Ionicons name="school-outline" size={22} color={color} />
    }} 
   />
  </Drawer.Navigator>
 );
}

// 6. Root Stack (Auth & GLOBAL SCREENS)
export default function AppNavigator() {
 const [user, setUser] = useState<User | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  const unsub = onAuthStateChanged(auth, (u) => {
   setUser(u);
   setLoading(false);
  });
  return unsub;
 }, []);

 if (loading) return null;

 return (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
   {!user ? (
    <Stack.Screen name="Auth" component={AuthScreen} />
   ) : (
    <>
     <Stack.Screen name="Main" component={DrawerRoot} />
     
     {/* Onboarding */}
     <Stack.Screen name="LanguageSelect" component={LanguageSelectionScreen} />
     <Stack.Screen name="InterestSelection" component={InterestSelectionScreen} />

     {/* GLOBAL SCREENS - Accessible from anywhere */}
     <Stack.Screen name="Chat" component={ChatScreen} />
     <Stack.Screen name="UploadContent" component={UploadContentScreen} />
    </>
   )}
  </Stack.Navigator>
 );
}