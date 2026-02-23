import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { Plus, Search, Filter } from 'lucide-react-native';
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
  const router = useRouter();

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
    fetchItems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm"
      style={{ width: ITEM_WIDTH }}
      onPress={() => {/* Navigate to item detail */ }}
    >
      <Image
        source={{ uri: item.image_url }}
        className="w-full aspect-square"
        resizeMode="cover"
      />
      <View className="p-3">
        <Text className="font-semibold text-gray-800" numberOfLines={1}>{item.category || 'Uncategorized'}</Text>
        <Text className="text-gray-500 text-xs mt-1">{item.color || 'Unknown color'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-3xl font-bold text-gray-900">My Closet</Text>
        <TouchableOpacity
          className="bg-black p-3 rounded-full shadow-lg"
          onPress={() => router.push('/upload')}
        >
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View className="px-6 flex-row space-x-2 mb-4 mt-2">
        <View className="flex-1 flex-row items-center bg-white px-4 py-2 rounded-xl shadow-sm">
          <Search size={18} color="#9CA3AF" />
          <Text className="text-gray-400 ml-2">Search items...</Text>
        </View>
        <TouchableOpacity className="bg-white p-2 rounded-xl shadow-sm justify-center items-center">
          <Filter size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View className="flex-1 justify-center items-center px-10">
          <View className="bg-gray-100 p-8 rounded-full mb-6">
            <Shirt size={64} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">Closet is empty</Text>
          <Text className="text-gray-500 text-center mb-8">
            Start by adding your favorite clothing items to build your digital wardrobe.
          </Text>
          <TouchableOpacity
            className="bg-black px-8 py-3 rounded-xl"
            onPress={() => router.push('/upload')}
          >
            <Text className="text-white font-semibold flex-row items-center">
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
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 24 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}
