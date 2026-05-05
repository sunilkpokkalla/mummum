import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Image, Pressable, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Typography from '@/components/Typography';
import Card from '@/components/Card';
import { Award, Camera, CheckCircle, Circle, Bell, ChevronRight, Star, Lock, Unlock } from 'lucide-react-native';
import { useBabyStore } from '@/store/useBabyStore';
import { saveImagePermanently } from '@/utils/imagePersistor';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

const MILESTONE_DATA = [
  // 2 MONTHS
  { id: 'm1', age: '2m', title: 'Social Smile', category: 'Social', description: 'Smiles at people to get attention.' },
  { id: 'm2', age: '2m', title: 'Coos', category: 'Language', description: 'Makes gurgling sounds.' },
  { id: 'm3', age: '2m', title: 'Head Control', category: 'Motor', description: 'Holds head up when on tummy.' },
  { id: 'm4', age: '2m', title: 'Tracks Objects', category: 'Cognitive', description: 'Follows things with eyes.' },
  
  // 4 MONTHS
  { id: 'm5', age: '4m', title: 'Giggles', category: 'Social', description: 'Laughs aloud when tickled.' },
  { id: 'm6', age: '4m', title: 'Steady Head', category: 'Motor', description: 'Holds head steady unsupported.' },
  { id: 'm7', age: '4m', title: 'Reaching', category: 'Motor', description: 'Swings at dangling toys.' },
  { id: 'm8', age: '4m', title: 'Pushes Up', category: 'Motor', description: 'Pushes up on elbows.' },

  // 6 MONTHS
  { id: 'm9', age: '6m', title: 'Recognizes Faces', category: 'Social', description: 'Knows familiar people.' },
  { id: 'm10', age: '6m', title: 'Babbling', category: 'Language', description: 'Makes "ba", "da" sounds.' },
  { id: 'm11', age: '6m', title: 'Rolls Over', category: 'Motor', description: 'Rolls front to back.' },
  { id: 'm12', age: '6m', title: 'Sits with Support', category: 'Motor', description: 'Sits when propped up.' },

  // 9 MONTHS
  { id: 'm13', age: '9m', title: 'Shy with Strangers', category: 'Social', description: 'Clings to familiar adults.' },
  { id: 'm14', age: '9m', title: 'Understands "No"', category: 'Language', description: 'Responds to basic commands.' },
  { id: 'm15', age: '9m', title: 'Sits Alone', category: 'Motor', description: 'Sits without any support.' },
  { id: 'm16', age: '9m', title: 'Crawling', category: 'Motor', description: 'Moves on hands and knees.' },
  { id: 'm17', age: '9m', title: 'Pincer Grasp', category: 'Motor', description: 'Uses thumb and finger.' },

  // 12 MONTHS
  { id: 'm18', age: '12m', title: 'Waving "Bye"', category: 'Social', description: 'Uses simple gestures.' },
  { id: 'm19', age: '12m', title: 'Mama/Dada', category: 'Language', description: 'Says simple specific words.' },
  { id: 'm20', age: '12m', title: 'Pull to Stand', category: 'Motor', description: 'Pulls up on furniture.' },
  { id: 'm21', age: '12m', title: 'Cruising', category: 'Motor', description: 'Walks holding furniture.' },
  
  // 15 MONTHS
  { id: 'm22', age: '15m', title: 'Walks Alone', category: 'Motor', description: 'Takes steps without help.' },
  { id: 'm23', age: '15m', title: 'Uses Spoon', category: 'Motor', description: 'Tries to feed self.' },
  { id: 'm24', age: '15m', title: 'Follows Instructions', category: 'Language', description: 'Understands simple commands.' },
  
  // 18 MONTHS
  { id: 'm25', age: '18m', title: 'Runs', category: 'Motor', description: 'Moves fast and steady.' },
  { id: 'm26', age: '18m', title: 'Climbs Chairs', category: 'Motor', description: 'Climbs on/off furniture.' },
  { id: 'm27', age: '18m', title: 'Points to Body Parts', category: 'Language', description: 'Knows where nose/eyes are.' },
  { id: 'm28', age: '18m', title: 'Pretend Play', category: 'Social', description: 'Feeds a doll or toy.' },

  // 24 MONTHS (2 YEARS)
  { id: 'm29', age: '24m', title: 'Two-Word Phrases', category: 'Language', description: 'Says "Eat apple" or "Dada go".' },
  { id: 'm30', age: '24m', title: 'Kicks Ball', category: 'Motor', description: 'Swings leg to kick a ball.' },
  { id: 'm31', age: '24m', title: 'Parallel Play', category: 'Social', description: 'Plays near other children.' },
  { id: 'm32', age: '24m', title: 'Tiptoeing', category: 'Motor', description: 'Stands/walks on tiptoes.' },
];

export default function MilestonesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { babies, currentBabyId, memories, addMemory, completedMilestones, toggleMilestone } = useBabyStore();
  const currentBaby = babies.find(b => b.id === currentBabyId);
  const completedIds = (completedMilestones as any)[currentBabyId || ''] || [];
  const babyMemories = memories.filter(m => m.babyId === currentBabyId);

  const handleAddMemory = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to save memories.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (!result.canceled) {
      const permanentUri = await saveImagePermanently(result.assets[0].uri);
      const newMemory = {
        id: Date.now().toString(),
        uri: permanentUri,
        title: `Memory - ${format(new Date(), 'MMM d')}`,
        timestamp: new Date()
      };
      addMemory(newMemory);
    }
  };

  const getBabyAge = (birthDate: Date | string | undefined) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const now = new Date();
    const diffMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    return `${diffMonths} months old`;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8FAFB' }]}>
        <View style={styles.titleSection}>
          <Typography variant="display" style={styles.title}>Milestones</Typography>
          <Typography variant="bodyLg" color="#607D8B">
            {currentBaby?.name || 'Your baby'}'s developmental journey ({getBabyAge(currentBaby?.birthDate)})
          </Typography>
        </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Score */}
        <Card style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View>
              <Typography variant="bodyLg" weight="700" color="#4A5D4C">Mastery Score</Typography>
              <Typography variant="label" color="#607D8B">{completedIds.length} milestones reached</Typography>
            </View>
            <Award size={40} color="#C69C82" />
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(completedIds.length / MILESTONE_DATA.length) * 100}%` }]} />
          </View>
        </Card>

        {/* Milestone Groups */}
        <View style={styles.section}>
          <Typography variant="headline" weight="700" style={styles.sectionTitle}>Developmental Roadmap</Typography>
          {MILESTONE_DATA.map((milestone) => (
            <Pressable 
              key={milestone.id} 
              style={[styles.milestoneCard, completedIds.includes(milestone.id) && styles.milestoneCardCompleted]}
              onPress={() => {
                if (completedIds.includes(milestone.id)) {
                  // If completed, clicking the card does nothing unless unlocked via the icon
                  return;
                }
                toggleMilestone(milestone.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
            >
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(milestone.category) }]}>
                <Typography variant="label" weight="800" color="#fff">{milestone.category[0]}</Typography>
              </View>
              <View style={styles.milestoneInfo}>
                <Typography weight="700" color="#455A64">{milestone.title}</Typography>
                <Typography variant="label" color="#90A4AE">{milestone.age} • {milestone.description}</Typography>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {completedIds.includes(milestone.id) && (
                  <TouchableOpacity 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      toggleMilestone(milestone.id);
                    }}
                    hitSlop={12}
                    style={{ padding: 4 }}
                  >
                    <Lock size={16} color="#90A4AE" />
                  </TouchableOpacity>
                )}
                <View style={styles.checkContainer}>
                  {completedIds.includes(milestone.id) ? (
                    <CheckCircle size={26} color="#4CAF50" />
                  ) : (
                    <Circle size={26} color="#CFD8DC" />
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Typography variant="headline" weight="700" style={styles.sectionTitle}>Photo Memories</Typography>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.memoryScroll}
              snapToInterval={176} // Card width (160) + margin (16)
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 40 }}
            >
              <TouchableOpacity style={styles.addMemory} onPress={handleAddMemory}>
                <Camera size={28} color="#C69C82" />
                <Typography variant="label" color="#C69C82" weight="700">Add Photo</Typography>
              </TouchableOpacity>
              
              {babyMemories.map((memory, index) => (
                <View 
                  key={memory.id} 
                  style={[
                    styles.polaroidCard, 
                    { transform: [{ rotate: index % 2 === 0 ? '1.5deg' : '-1.5deg' }] }
                  ]}
                >
                   <Image 
                     source={memory.uri ? { uri: memory.uri } : require('@/assets/images/baby_avatar.png')} 
                     style={styles.polaroidImg} 
                   />
                   <Typography variant="label" weight="700" style={styles.polaroidLabel}>{memory.title}</Typography>
                   <Typography variant="label" color="#90A4AE" style={{ fontSize: 10 }}>{format(new Date(memory.timestamp), 'MMM d, yyyy')}</Typography>
                </View>
              ))}
            </ScrollView>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const getCategoryColor = (cat: string) => {
  switch(cat) {
    case 'Social': return '#FFAB91';
    case 'Language': return '#90CAF9';
    case 'Motor': return '#A5D6A7';
    case 'Cognitive': return '#CE93D8';
    default: return '#B0BEC5';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 8,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    color: '#1B3C35',
  },
  content: {
    flex: 1,
  },
  scoreCard: {
    margin: 24,
    marginTop: 0,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#C69C82',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 20,
    color: '#4A5D4C',
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  milestoneCardCompleted: {
    backgroundColor: '#F1F8E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
  },
  categoryBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneInfo: {
    flex: 1,
    gap: 1,
  },
  checkContainer: {
    marginLeft: 8,
  },
  memoryScroll: {
    flexDirection: 'row',
  },
  addMemory: {
    width: 160,
    height: 220,
    backgroundColor: '#FBE9E7',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#C69C82',
  },
  polaroidCard: {
    width: 160,
    height: 220,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    paddingBottom: 20,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    alignItems: 'center',
  },
  polaroidImg: {
    width: '100%',
    height: 140,
    borderRadius: 4,
    backgroundColor: '#F8FAFB',
  },
  polaroidLabel: {
    marginTop: 12,
    color: '#455A64',
    textAlign: 'center',
  },
});
