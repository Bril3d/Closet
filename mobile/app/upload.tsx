import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, TextInput, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Camera, UploadCloud, X, LayoutGrid, Palette, FileText, Tag, DollarSign, Sparkles } from 'lucide-react-native';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Shoes', 'Accessories', 'Dress'];

export default function UploadScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [price, setPrice] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [aiResults, setAiResults] = useState<any>(null);
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const runAIConsultation = async (uri: string) => {
    setIsScanning(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      formData.append('file', { uri, name: filename, type: 'image/jpeg' } as any);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      const response = await fetch(`${api.defaults.baseURL}/items/classify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setAiResults(data);
        if (data.category) {
          const match = CATEGORIES.find(cat => cat === data.category);
          if (match) setCategory(match);
        }
        if (data.dominant_color) setColor(data.dominant_color);
        if (data.suggested_tags) setSuggestedTags(data.suggested_tags);
      }
    } catch (e) {
      console.error('AI classification failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission Required", "Please allow photo access."); return; }
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled) { setImage(result.assets[0].uri); runAIConsultation(result.assets[0].uri); }
    } catch (e) { Alert.alert('Error', 'Failed to pick image'); }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission Required", "Please allow camera access."); return; }
      let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled) { setImage(result.assets[0].uri); runAIConsultation(result.assets[0].uri); }
    } catch (e) { Alert.alert('Error', 'Failed to take photo'); }
  };

  const handleUpload = async () => {
    if (!image) { Alert.alert('Error', 'Please select an image first'); return; }
    if (!category) { Alert.alert('Error', 'Please select a category'); return; }
    setLoading(true);
    try {
      const uploadUrl = `${api.defaults.baseURL}/items/`;
      const fileInfo = await FileSystem.getInfoAsync(image);
      if (!fileInfo.exists) throw new Error('Image file not found.');

      const uploadResult = await FileSystem.uploadAsync(uploadUrl, image, {
        fieldName: 'file', httpMethod: 'POST', uploadType: 1,
        parameters: {
          category,
          ...(color ? { color } : {}),
          ...(description ? { description } : {}),
          ...(price ? { price } : {}),
          tags_json: JSON.stringify(selectedTags),
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (uploadResult.status !== 200 && uploadResult.status !== 201) {
        let msg = 'Upload failed';
        try { const p = JSON.parse(uploadResult.body); if (p.detail) msg = p.detail; } catch {}
        throw new Error(msg);
      }
      Alert.alert('Success', 'Item added to your closet!', [{ text: 'OK', onPress: () => router.push('/(tabs)') }]);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerAction}><X size={24} color="#1F2937" /></TouchableOpacity>
        <Text style={s.headerTitle}>Add Item</Text>
        <TouchableOpacity onPress={handleUpload} disabled={loading || !image} style={s.headerAction}>
          {loading ? <ActivityIndicator size="small" color="#000" /> : <Text style={[s.saveText, !image && s.disabledText]}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={s.scrollContent}>
        <View style={s.imageSection}>
          {image ? (
            <View style={s.selectedImageContainer}>
              <Image source={{ uri: image }} style={s.selectedImage} />
              <TouchableOpacity style={s.removeImageButton} onPress={() => { setImage(null); setAiResults(null); setSuggestedTags([]); }}>
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.uploadPlaceholder}>
              <View style={s.uploadButtonsRow}>
                <TouchableOpacity style={s.uploadButton} onPress={takePhoto}><Camera size={28} color="#1F2937" /><Text style={s.uploadButtonText}>Camera</Text></TouchableOpacity>
                <TouchableOpacity style={s.uploadButton} onPress={pickImage}><UploadCloud size={28} color="#1F2937" /><Text style={s.uploadButtonText}>Gallery</Text></TouchableOpacity>
              </View>
              <Text style={s.placeholderText}>Take a photo or choose from gallery</Text>
            </View>
          )}
        </View>

        <View style={s.formContainer}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Item Details</Text>
            {isScanning && (<View style={s.scanningBadge}><ActivityIndicator size="small" color="#7C3AED" /><Text style={s.scanningText}>AI Scanning...</Text></View>)}
          </View>

          {/* AI Results */}
          {aiResults && aiResults.top_predictions && (
            <View style={s.aiCard}>
              <View style={s.aiHeader}><Sparkles size={18} color="#7C3AED" /><Text style={s.aiTitle}>AI Classification</Text></View>
              {aiResults.top_predictions.map((pred: any, i: number) => (
                <View key={i} style={s.predRow}>
                  <Text style={s.predLabel}>{pred.subcategory || pred.category}</Text>
                  <View style={s.confBar}><View style={[s.confFill, { width: `${Math.round(pred.confidence * 100)}%` as any }]} /></View>
                  <Text style={s.predConf}>{Math.round(pred.confidence * 100)}%</Text>
                </View>
              ))}
              {aiResults.attributes && Object.keys(aiResults.attributes).length > 0 && (
                <View style={s.attrRow}>
                  {Object.entries(aiResults.attributes).map(([k, v]: [string, any]) => (
                    <View key={k} style={s.attrChip}><Text style={s.attrText}>{k}: {v}</Text></View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Category */}
          <View style={[s.inputGroup, s.categoryGroup]}>
            <LayoutGrid size={20} color="#6B7280" />
            <View style={s.inputWrapper}>
              <Text style={s.inputLabel}>Select Category</Text>
              <View style={s.categoryChips}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat} style={[s.chip, category === cat && s.activeChip]} onPress={() => setCategory(cat)}>
                    <Text style={[s.chipText, category === cat && s.activeChipText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Color */}
          <View style={s.inputGroup}>
            <Palette size={20} color="#6B7280" />
            <View style={s.inputWrapper}>
              <Text style={s.inputLabel}>Color</Text>
              <TextInput placeholder="Enter color (optional)" style={s.input} value={color} onChangeText={setColor} placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          {/* Price */}
          <View style={s.inputGroup}>
            <DollarSign size={20} color="#6B7280" />
            <View style={s.inputWrapper}>
              <Text style={s.inputLabel}>Purchase Price</Text>
              <TextInput placeholder="Enter price (optional)" style={s.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          {/* Description */}
          <View style={[s.inputGroup, s.alignItemsStart]}>
            <FileText size={20} color="#6B7280" style={s.iconMarginTop} />
            <View style={s.inputWrapper}>
              <Text style={s.inputLabel}>Description</Text>
              <TextInput placeholder="Add notes (optional)" style={[s.input, s.multilineInput]} value={description} onChangeText={setDescription} multiline numberOfLines={3} textAlignVertical="top" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          {/* Suggested Tags */}
          {suggestedTags.length > 0 && (
            <View style={[s.inputGroup, s.categoryGroup]}>
              <Tag size={20} color="#6B7280" />
              <View style={s.inputWrapper}>
                <Text style={s.inputLabel}>AI Suggested Tags (tap to select)</Text>
                <View style={s.categoryChips}>
                  {suggestedTags.map(tag => (
                    <TouchableOpacity key={tag} style={[s.chip, selectedTags.includes(tag) && s.activeChip]} onPress={() => setSelectedTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag])}>
                      <Text style={[s.chipText, selectedTags.includes(tag) && s.activeChipText]}>{tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' } as ViewStyle,
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF' } as ViewStyle,
  headerAction: { padding: 8, minWidth: 40 } as ViewStyle,
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#7C3AED' } as TextStyle,
  saveText: { fontSize: 18, fontWeight: '700', color: '#7C3AED' } as TextStyle,
  disabledText: { color: '#9CA3AF' } as TextStyle,
  scrollView: { flex: 1 } as ViewStyle,
  scrollContent: { paddingBottom: 40 } as ViewStyle,
  imageSection: { paddingHorizontal: 24, paddingVertical: 24, alignItems: 'center' } as ViewStyle,
  selectedImageContainer: { width: '100%', position: 'relative', borderRadius: 24, overflow: 'hidden', backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 } as ViewStyle,
  selectedImage: { width: '100%', aspectRatio: 1 } as ImageStyle,
  removeImageButton: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 100 } as ViewStyle,
  uploadPlaceholder: { width: '100%', aspectRatio: 1, backgroundColor: '#F5F3FF', borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#7C3AED', opacity: 0.8 } as ViewStyle,
  uploadButtonsRow: { flexDirection: 'row', gap: 24 } as ViewStyle,
  uploadButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', width: 80, height: 80, borderRadius: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } as ViewStyle,
  uploadButtonText: { fontSize: 12, fontWeight: '500', color: '#4B5563', marginTop: 4 } as TextStyle,
  placeholderText: { color: '#9CA3AF', marginTop: 24, fontWeight: '500' } as TextStyle,
  formContainer: { paddingHorizontal: 24, gap: 16 } as ViewStyle,
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' } as TextStyle,
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as ViewStyle,
  scanningBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6 } as ViewStyle,
  scanningText: { fontSize: 12, color: '#7C3AED', fontWeight: '600' } as TextStyle,
  aiCard: { backgroundColor: '#F5F3FF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EDE9FE', gap: 10 } as ViewStyle,
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 } as ViewStyle,
  aiTitle: { fontSize: 15, fontWeight: '700', color: '#7C3AED' } as TextStyle,
  predRow: { flexDirection: 'row', alignItems: 'center', gap: 8 } as ViewStyle,
  predLabel: { width: 80, fontSize: 13, fontWeight: '600', color: '#4B5563' } as TextStyle,
  confBar: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' } as ViewStyle,
  confFill: { height: '100%', backgroundColor: '#7C3AED', borderRadius: 4 } as ViewStyle,
  predConf: { width: 40, fontSize: 13, fontWeight: '700', color: '#7C3AED', textAlign: 'right' } as TextStyle,
  attrRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 } as ViewStyle,
  attrChip: { backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#EDE9FE' } as ViewStyle,
  attrText: { fontSize: 11, color: '#7C3AED', fontWeight: '500' } as TextStyle,
  inputGroup: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EDE9FE', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 } as ViewStyle,
  categoryGroup: { paddingBottom: 20, alignItems: 'flex-start' } as ViewStyle,
  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 } as ViewStyle,
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' } as ViewStyle,
  activeChip: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' } as ViewStyle,
  chipText: { fontSize: 13, fontWeight: '600', color: '#4B5563' } as TextStyle,
  activeChipText: { color: '#FFFFFF' } as TextStyle,
  inputWrapper: { flex: 1, marginLeft: 12, borderLeftWidth: 1, borderLeftColor: '#F5F3FF', paddingLeft: 12 } as ViewStyle,
  inputLabel: { fontSize: 12, color: '#7C3AED', fontWeight: '600', marginBottom: 4 } as TextStyle,
  input: { fontSize: 16, color: '#111827', fontWeight: '500', paddingVertical: 0 } as TextStyle,
  multilineInput: { height: 80 } as TextStyle,
  alignItemsStart: { alignItems: 'flex-start' } as ViewStyle,
  iconMarginTop: { marginTop: 4 } as ViewStyle,
});
