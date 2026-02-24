import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, SafeAreaView, Dimensions, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Plus, Search, Filter, Shirt, LogOut } from 'lucide-react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

export default function ClosetScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  const fetchItems = async () => {
    try {
      const response = await api.get('/items/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchItems();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
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
      <View style={styles.itemInfo}>
        <Text style={styles.itemCategory} numberOfLines={1}>{item.category || 'Uncategorized'}</Text>
        <Text style={styles.itemColor}>{item.color || 'Unknown color'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
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

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" />
          <Text style={styles.searchText}>Search items...</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Shirt size={64} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>Closet is empty</Text>
          <Text style={styles.emptySubtitle}>
            Start by adding your favorite clothing items to build your digital wardrobe.
          </Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={() => router.push('/upload')}
          >
            <Text style={styles.emptyAddButtonText}>
              Add First Item
            </Text>
          </TouchableOpacity>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
  searchText: {
    color: '#9CA3AF',
    marginLeft: 12,
    fontSize: 16,
  } as TextStyle,
  filterButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
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
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  } as ViewStyle,
  listContent: {
    paddingBottom: 100,
  } as ViewStyle,
});

