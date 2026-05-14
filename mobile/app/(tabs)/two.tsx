import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, ViewStyle, TextStyle, ImageStyle, ActivityIndicator, RefreshControl } from 'react-native';
import { Plus, Sparkles, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export default function OutfitsScreen() {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  const fetchOutfits = async () => {
    try {
      const response = await api.get('/outfits/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOutfits(response.data);
    } catch (error) {
      console.error('Error fetching outfits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchOutfits();
      }
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOutfits();
  };

  const renderOutfit = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.outfitCard} onPress={() => router.push(`/outfits/${item.id}`)}>
      <View style={styles.outfitPreview}>
        {item.items.slice(0, 4).map((clothing: any, index: number) => (
          <Image
            key={clothing.id}
            source={{ uri: clothing.image_url }}
            style={[
              styles.previewImage,
              index === 0 && styles.firstImage,
              index === 1 && styles.secondImage,
              index === 2 && styles.thirdImage,
              index === 3 && styles.fourthImage,
            ]}
          />
        ))}
        {item.items.length === 0 && (
          <View style={styles.emptyPreview}>
            <Sparkles size={32} color="#DDD" />
          </View>
        )}
      </View>
      <View style={styles.outfitInfo}>
        <View>
          <Text style={styles.outfitName}>{item.name}</Text>
          <Text style={styles.outfitCount}>{item.items.length} items</Text>
        </View>
        <ChevronRight size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Outfits</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/outfits/create')}
        >
          <Plus size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {outfits.length === 0 ? (
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Sparkles size={64} color="#7C3AED" />
          </View>
          <Text style={styles.emptyTitle}>No outfits yet</Text>
          <Text style={styles.emptySubtitle}>
            Start grouping your clothes into stylish outfits for a stress-free morning.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/outfits/create')}
          >
            <Plus size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>
              Create First Outfit
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={outfits}
          renderItem={renderOutfit}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  headerButton: {
    backgroundColor: '#F5F3FF',
    padding: 8,
    borderRadius: 12,
  } as ViewStyle,
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#7C3AED',
  } as TextStyle,
  listContent: {
    padding: 24,
  } as ViewStyle,
  outfitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  } as ViewStyle,
  outfitPreview: {
    height: 180,
    backgroundColor: '#F5F3FF',
    flexDirection: 'row',
    flexWrap: 'wrap',
  } as ViewStyle,
  previewImage: {
    width: '50%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  } as ImageStyle,
  firstImage: { width: '50%', height: '100%' },
  secondImage: { width: '50%', height: '100%' },
  thirdImage: { width: '50%', height: '100%' },
  fourthImage: { width: '50%', height: '100%' },
  emptyPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  outfitInfo: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  outfitName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  } as TextStyle,
  outfitCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  } as TextStyle,
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  } as ViewStyle,
  iconCircle: {
    backgroundColor: '#F5F3FF',
    padding: 32,
    borderRadius: 100,
    marginBottom: 24,
  } as ViewStyle,
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  } as TextStyle,
  emptySubtitle: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  } as TextStyle,
  button: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  buttonIcon: {
    marginRight: 8,
  } as ViewStyle,
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
    marginLeft: 8,
  } as TextStyle,
});
