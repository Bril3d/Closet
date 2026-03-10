import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView, Dimensions, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, Edit, ChevronRight } from 'lucide-react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');

interface Item {
  id: string;
  image_url: string;
  category: string;
  color?: string;
  description?: string;
}

interface Outfit {
  id: string;
  name: string;
  description: string;
  items: Item[];
}

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    const fetchOutfit = async () => {
      try {
        const response = await api.get(`/outfits/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOutfit(response.data);
      } catch (error) {
        console.error('Error fetching outfit:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchOutfit();
    }
  }, [id, token]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!outfit) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Outfit not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Group items by broad categories for "fitted" rendering
  const itemsByCategory: { [key: string]: Item[] } = {
    outerwear: outfit.items.filter(i => i.category?.toLowerCase().includes('outer')),
    tops: outfit.items.filter(i => i.category?.toLowerCase() === 'tops' || (i.category?.toLowerCase().includes('shirt') && !i.category?.toLowerCase().includes('outer'))),
    bottoms: outfit.items.filter(i => i.category?.toLowerCase().includes('bottom') || i.category?.toLowerCase().includes('pants') || i.category?.toLowerCase().includes('skirt')),
    shoes: outfit.items.filter(i => i.category?.toLowerCase().includes('shoe') || i.category?.toLowerCase().includes('sneaker')),
    accessories: outfit.items.filter(i => i.category?.toLowerCase().includes('access') || i.category?.toLowerCase().includes('hat') || i.category?.toLowerCase().includes('bag')),
  };
  const renderFittedPreview = () => (
    <View style={styles.fittedPreviewContainer}>
      <View style={styles.fittingMannequin}>
        {/* 1. Tops Layer (Bottom-most of the torso) */}
        {itemsByCategory.tops[0] && (
          <Image source={{ uri: itemsByCategory.tops[0].image_url }} style={[styles.fittedImage, styles.topsLayer]} resizeMode="contain" />
        )}

        {/* 2. Bottoms Layer */}
        {itemsByCategory.bottoms[0] && (
          <Image source={{ uri: itemsByCategory.bottoms[0].image_url }} style={[styles.fittedImage, styles.bottomsLayer]} resizeMode="contain" />
        )}

        {/* 3. Outerwear Layer (On top of tops) */}
        {itemsByCategory.outerwear[0] && (
          <Image source={{ uri: itemsByCategory.outerwear[0].image_url }} style={[styles.fittedImage, styles.outerwearLayer]} resizeMode="contain" />
        )}

        {/* 4. Shoes Layer */}
        {itemsByCategory.shoes[0] && (
          <Image source={{ uri: itemsByCategory.shoes[0].image_url }} style={[styles.fittedImage, styles.shoesLayer]} resizeMode="contain" />
        )}

        {/* 5. Accessories (Top-most) */}
        {itemsByCategory.accessories[0] && (
          <Image source={{ uri: itemsByCategory.accessories[0].image_url }} style={[styles.fittedImage, styles.accessoriesLayer]} resizeMode="contain" />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Share2 size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push(`/outfits/edit/${id}`)}>
            <Edit size={22} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {renderFittedPreview()}

        <View style={styles.infoSection}>
          <Text style={styles.outfitName}>{outfit.name}</Text>
          {outfit.description && (
            <Text style={styles.outfitDescription}>{outfit.description}</Text>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Items in this Look</Text>
          {outfit.items.map((item) => (
            <TouchableOpacity key={item.id} style={styles.itemRow} onPress={() => {/* View item details if needed */ }}>
              <Image source={{ uri: item.image_url }} style={styles.itemThumbnail} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemCategory}>{item.category || 'Uncategorized'}</Text>
                <Text style={styles.itemColor}>{item.color || 'Default color'}</Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  } as ViewStyle,
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
  } as TextStyle,
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
  } as ViewStyle,
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  } as TextStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    background: '#FFF',
  } as ViewStyle,
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  } as ViewStyle,
  iconButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  } as ViewStyle,
  scrollContent: {
    paddingBottom: 40,
  } as ViewStyle,
  fittedPreviewContainer: {
    height: 400,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 20,
    borderRadius: 32,
    marginTop: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  } as ViewStyle,
  fittingMannequin: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
  } as ViewStyle,
  fittedImage: {
    position: 'absolute',
    width: '70%',
    height: '40%',
  } as ImageStyle,
  outerwearLayer: {
    top: '2%',
    zIndex: 3,
    width: '90%',
    height: '45%',
  } as ImageStyle,
  topsLayer: {
    top: '5%',
    zIndex: 1, // Move tops to background
    width: '70%',
    height: '40%',
  } as ImageStyle,
  bottomsLayer: {
    top: '38%',
    zIndex: 2,
    width: '80%',
    height: '45%',
  } as ImageStyle,
  shoesLayer: {
    bottom: '2%',
    zIndex: 4,
    width: '55%',
    height: '22%',
  } as ImageStyle,
  accessoriesLayer: {
    top: '5%',
    right: '5%',
    zIndex: 5,
    width: '30%',
    height: '25%',
  } as ImageStyle,
  infoSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  } as ViewStyle,
  outfitName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  } as TextStyle,
  outfitDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginTop: 8,
  } as TextStyle,
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  } as TextStyle,
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  } as ViewStyle,
  itemThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  } as ImageStyle,
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  } as ViewStyle,
  itemCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4338CA',
  } as TextStyle,
  itemColor: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  } as TextStyle,
});
