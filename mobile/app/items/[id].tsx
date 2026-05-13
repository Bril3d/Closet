import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Dimensions, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, Edit, Trash2, Tag, Palette, LayoutGrid, Sparkles } from 'lucide-react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');

interface ItemDetail {
  id: string;
  image_url: string;
  category: string;
  color?: string;
  description?: string;
  is_favorite: boolean;
  price?: number;
  times_worn?: number;
  tags: { id: string; name: string }[];
  created_at: string;
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await api.get(`/items/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItem(response.data);
      } catch (error) {
        console.error('Error fetching item:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchItem();
    }
  }, [id, token]);

  const toggleFavorite = async () => {
    if (!item) return;
    const newStatus = !item.is_favorite;
    setItem({ ...item, is_favorite: newStatus });

    try {
      await api.patch(`/items/${item.id}`,
        { is_favorite: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to toggle favorite', error);
      setItem({ ...item, is_favorite: !newStatus });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to remove this item from your closet? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/items/${item?.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              router.back();
            } catch (error) {
              console.error('Failed to delete item', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Item not found</Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const costPerWear = item.price && item.times_worn && item.times_worn > 0
    ? (item.price / item.times_worn).toFixed(2)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFavorite}>
            <Heart
              size={22}
              color={item.is_favorite ? '#EF4444' : '#9CA3AF'}
              fill={item.is_favorite ? '#EF4444' : 'transparent'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push(`/items/edit/${id}`)}>
            <Edit size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, styles.deleteButton]} onPress={handleDelete}>
            <Trash2 size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="contain" />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.category}>{item.category || 'Uncategorized'}</Text>
            {item.is_favorite && (
              <View style={styles.favBadge}>
                <Heart size={14} color="#EF4444" fill="#EF4444" />
                <Text style={styles.favBadgeText}>Favorite</Text>
              </View>
            )}
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            {item.color && (
              <View style={styles.detailCard}>
                <Palette size={20} color="#7C3AED" />
                <Text style={styles.detailLabel}>Color</Text>
                <Text style={styles.detailValue}>{item.color}</Text>
              </View>
            )}
            <View style={styles.detailCard}>
              <LayoutGrid size={20} color="#7C3AED" />
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{item.category || 'N/A'}</Text>
            </View>
            {item.price != null && (
              <View style={styles.detailCard}>
                <Text style={styles.priceIcon}>💰</Text>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailValue}>${item.price.toFixed(2)}</Text>
              </View>
            )}
            {costPerWear && (
              <View style={styles.detailCard}>
                <Sparkles size={20} color="#7C3AED" />
                <Text style={styles.detailLabel}>Cost/Wear</Text>
                <Text style={styles.detailValue}>${costPerWear}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {item.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </View>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {item.tags.map((tag) => (
                  <View key={tag.id} style={styles.tagChip}>
                    <Tag size={12} color="#7C3AED" />
                    <Text style={styles.tagText}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.dateText}>
              Added {new Date(item.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </Text>
          </View>
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
  goBackButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
  } as ViewStyle,
  goBackText: {
    color: '#FFFFFF',
    fontWeight: '600',
  } as TextStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  } as ViewStyle,
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  } as ViewStyle,
  iconButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  } as ViewStyle,
  deleteButton: {
    backgroundColor: '#FEF2F2',
  } as ViewStyle,
  scrollContent: {
    paddingBottom: 40,
  } as ViewStyle,
  imageContainer: {
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  } as ViewStyle,
  itemImage: {
    width: '100%',
    aspectRatio: 1,
  } as ImageStyle,
  infoSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  } as ViewStyle,
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  } as ViewStyle,
  category: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  } as TextStyle,
  favBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  } as ViewStyle,
  favBadgeText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  } as TextStyle,
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  } as ViewStyle,
  detailCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: (width - 48 - 24) / 2 - 6,
    flex: 1,
    gap: 6,
  } as ViewStyle,
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  } as TextStyle,
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  } as TextStyle,
  priceIcon: {
    fontSize: 20,
  } as TextStyle,
  section: {
    marginBottom: 20,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  } as TextStyle,
  descriptionText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  } as TextStyle,
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  } as ViewStyle,
  tagText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  } as TextStyle,
  dateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  } as TextStyle,
});
