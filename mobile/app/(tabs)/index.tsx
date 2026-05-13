import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, SafeAreaView, Dimensions, StyleSheet, ViewStyle, TextStyle, ImageStyle, TextInput, ScrollView } from 'react-native';
import { Plus, Search, Shirt, LogOut, X, Heart } from 'lucide-react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const { width } = Dimensions.get('window');
const GAP = 16;
const PADDING = 24;
const ITEM_WIDTH = (width - (PADDING * 2) - GAP) / 2;

const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories'];

export default function ClosetScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFavoriteOnly, setIsFavoriteOnly] = useState(false);

  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  const fetchItems = async () => {
    try {
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (isFavoriteOnly) params.is_favorite = true;

      const response = await api.get('/items/', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      // Client-side search for description/category if needed, 
      // but let's stick to the items we got.
      let filtered = response.data;
      if (searchQuery) {
        filtered = filtered.filter((item: any) =>
          (item.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.category?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.color?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      setItems(filtered);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchItems();
      }
    }, [token, selectedCategory, isFavoriteOnly])
  );

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) fetchItems();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const toggleFavorite = async (itemId: string, currentStatus: boolean) => {
    // Optimistic update
    setItems(items.map((item: any) =>
      item.id === itemId ? { ...item, is_favorite: !currentStatus } : item
    ));

    try {
      await api.patch(`/items/${itemId}`,
        { is_favorite: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to toggle favorite', error);
      fetchItems(); // revert on failure
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.itemCard, { width: ITEM_WIDTH }]}
      onPress={() => {/* Navigate to item detail */ }}
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={styles.favoriteBadge}
        onPress={() => toggleFavorite(item.id, item.is_favorite)}
      >
        <Heart size={18} color={item.is_favorite ? "#EF4444" : "#FFF"} fill={item.is_favorite ? "#EF4444" : "rgba(0,0,0,0.3)"} />
      </TouchableOpacity>
      <View style={styles.itemInfo}>
        <Text style={styles.itemCategory} numberOfLines={1}>{item.category || 'Uncategorized'}</Text>
        <Text style={styles.itemColor}>{item.color || 'Unknown color'}</Text>
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
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Closet</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/upload')}
        >
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clothes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          <TouchableOpacity
            style={[styles.filterChip, isFavoriteOnly && styles.activeFilterChip]}
            onPress={() => setIsFavoriteOnly(!isFavoriteOnly)}
          >
            <Heart size={16} color={isFavoriteOnly ? "#FFF" : "#7C3AED"} fill={isFavoriteOnly ? "#FFF" : "transparent"} />
            <Text style={[styles.filterChipText, isFavoriteOnly && styles.activeFilterChipText]}>Favorites</Text>
          </TouchableOpacity>

          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, selectedCategory === cat && styles.activeFilterChip]}
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              <Text style={[styles.filterChipText, selectedCategory === cat && styles.activeFilterChipText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Shirt size={64} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery || selectedCategory || isFavoriteOnly ? "No matches found" : "Closet is empty"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || selectedCategory || isFavoriteOnly
              ? "Try adjusting your filters or search terms."
              : "Start by adding your favorite clothing items to build your digital wardrobe."
            }
          </Text>
          {(searchQuery || selectedCategory || isFavoriteOnly) ? (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setIsFavoriteOnly(false);
              }}
            >
              <Text style={styles.clearFiltersText}>Clear all filters</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => router.push('/upload')}
            >
              <Text style={styles.emptyAddButtonText}>
                Add First Item
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
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
    backgroundColor: '#F9FAFB',
  } as ViewStyle,
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#7C3AED',
    marginRight: 12,
  } as TextStyle,
  logoutButton: {
    padding: 4,
  } as ViewStyle,
  addButton: {
    backgroundColor: '#7C3AED',
    padding: 12,
    borderRadius: 100,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
  searchSection: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  } as ViewStyle,
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  } as TextStyle,
  filterSection: {
    marginBottom: 16,
  } as ViewStyle,
  filterList: {
    paddingHorizontal: 24,
    gap: 8,
  } as ViewStyle,
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  } as ViewStyle,
  activeFilterChip: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  } as ViewStyle,
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  } as TextStyle,
  activeFilterChipText: {
    color: '#FFFFFF',
  } as TextStyle,
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  itemImage: {
    width: '100%',
    aspectRatio: 1,
  } as ImageStyle,
  favoriteBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 6,
    borderRadius: 100,
  } as ViewStyle,
  itemInfo: {
    padding: 12,
  } as ViewStyle,
  itemCategory: {
    fontWeight: '700',
    fontSize: 14,
    color: '#4338CA',
  } as TextStyle,
  itemColor: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  } as TextStyle,
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  } as ViewStyle,
  emptyIconCircle: {
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
  emptyAddButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  emptyAddButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  } as TextStyle,
  clearFiltersButton: {
    marginTop: 12,
  } as ViewStyle,
  clearFiltersText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 16,
  } as TextStyle,
  columnWrapper: {
    paddingHorizontal: PADDING,
    gap: GAP,
    marginBottom: GAP,
  } as ViewStyle,
  listContent: {
    paddingBottom: 100,
  } as ViewStyle,
});

