import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, SafeAreaView, TextInput, FlatList, Dimensions, ViewStyle, TextStyle, ImageStyle, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Save, X, Check } from 'lucide-react-native';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/useAuthStore';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 12;
const PADDING = 20;
const ITEM_WIDTH = (width - (PADDING * 2) - COLUMN_GAP) / 2;

interface Item {
  id: string;
  image_url: string;
  category: string;
}

export default function EditOutfitScreen() {
  const { id } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [outfitRes, itemsRes] = await Promise.all([
          api.get(`/outfits/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/items/', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setName(outfitRes.data.name);
        setDescription(outfitRes.data.description || '');
        setSelectedItems(outfitRes.data.items.map((i: any) => i.id));
        setAllItems(itemsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load outfit data');
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchData();
    }
  }, [id, token]);

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an outfit name');
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select at least one item');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/outfits/${id}`, {
        name,
        description,
        item_ids: selectedItems
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Success', 'Outfit updated!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating outfit:', error);
      Alert.alert('Error', 'Failed to update outfit');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: Item }) => {
    const isSelected = selectedItems.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.itemCard, isSelected && styles.selectedItemCard]}
        onPress={() => toggleItem(item.id)}
      >
        <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="cover" />
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Check size={14} color="#FFF" />
          </View>
        )}
        <View style={styles.itemOverlay}>
          <Text style={styles.itemCategory} numberOfLines={1}>{item.category}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <X size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Outfit</Text>
        <TouchableOpacity
          style={[styles.saveButton, (saving || !name) && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving || !name}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Save size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formSection}>
          <Text style={styles.label}>Outfit Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Summer Brunch"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add some notes about this look..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.itemsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Items</Text>
            <Text style={styles.selectionCount}>{selectedItems.length} selected</Text>
          </View>

          <FlatList
            data={allItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.columnWrapper}
          />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  } as ViewStyle,
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  } as TextStyle,
  iconButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  } as ViewStyle,
  saveButton: {
    padding: 10,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  disabledButton: {
    backgroundColor: '#C4B5FD',
  } as ViewStyle,
  scrollContent: {
    paddingBottom: 40,
  } as ViewStyle,
  formSection: {
    padding: 20,
    gap: 16,
  } as ViewStyle,
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: -8,
  } as TextStyle,
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  } as TextStyle,
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  } as TextStyle,
  itemsSection: {
    paddingHorizontal: 20,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  } as TextStyle,
  selectionCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  } as TextStyle,
  columnWrapper: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  } as ViewStyle,
  itemCard: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  } as ViewStyle,
  selectedItemCard: {
    borderColor: '#7C3AED',
  } as ViewStyle,
  itemImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    padding: 2,
  } as ViewStyle,
  itemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 6,
  } as ViewStyle,
  itemCategory: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,
});
