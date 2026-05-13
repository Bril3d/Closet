import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle2, Circle } from 'lucide-react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 3;

export default function OutfitCreatorScreen() {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    fetchItems();
  }, []);

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
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = async () => {
    if (!name || selectedIds.length === 0) return;

    setSaving(true);
    try {
      await api.post('/outfits/', {
        name,
        description,
        item_ids: selectedIds
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.back();
    } catch (error) {
      console.error('Error saving outfit:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => toggleSelection(item.id)}
      >
        <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="cover" />
        <View style={styles.selectionOverlay}>
          {isSelected ? (
            <CheckCircle2 size={24} color="#7C3AED" fill="#FFF" />
          ) : (
            <Circle size={24} color="rgba(255,255,255,0.8)" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#7C3AED" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Outfit</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!name || selectedIds.length === 0 || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <Text style={[styles.saveText, (!name || selectedIds.length === 0) && styles.disabledText]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <TextInput
          style={styles.nameInput}
          placeholder="Outfit Name (e.g. Summer Night)"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.descInput}
          placeholder="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.selectionHeader}>
        <Text style={styles.selectionTitle}>Select Items ({selectedIds.length})</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  } as ViewStyle,
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  } as ViewStyle,
  backButton: {
    padding: 4,
  } as ViewStyle,
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7C3AED',
  } as TextStyle,
  saveText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  } as TextStyle,
  disabledText: {
    color: '#D1D5DB',
  } as TextStyle,
  formSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  } as ViewStyle,
  nameInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  } as TextStyle,
  descInput: {
    fontSize: 16,
    color: '#6B7280',
    maxHeight: 100,
  } as TextStyle,
  selectionHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  } as ViewStyle,
  selectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,
  listContent: {
    padding: 12,
  } as ViewStyle,
  itemCard: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    padding: 4,
  } as ViewStyle,
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  } as ImageStyle,
  selectionOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  loader: {
    flex: 1,
  } as ViewStyle,
});
