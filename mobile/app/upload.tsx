import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, SafeAreaView, ActivityIndicator, TextInput, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Camera, UploadCloud, X, LayoutGrid, Palette, FileText } from 'lucide-react-native';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export default function UploadScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const pickImage = async () => {
    try {
      console.log('pickImage called');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission Result:', permissionResult);

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Please allow access to your photos in settings!");
        return;
      }

      console.log('Launching Image Library...');
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      console.log('Library Result:', result);

      if (!result.canceled) {
        console.log('Image selected:', result.assets[0].uri);
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Error in pickImage:', e);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      console.log('takePhoto called');
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera Permission:', permissionResult);

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Please allow camera access in settings!");
        return;
      }

      console.log('Launching Camera...');
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      console.log('Camera Result:', result);

      if (!result.canceled) {
        console.log('Photo taken:', result.assets[0].uri);
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Error in takePhoto:', e);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleUpload = async () => {
    console.log('handleUpload triggered');
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please enter a category');
      return;
    }

    setLoading(true);

    try {
      const uploadUrl = `${api.defaults.baseURL}/items/`;
      console.log('Target Upload URL:', uploadUrl);
      console.log('Auth Token exists:', !!token);
      console.log('Image URI:', image);

      // Verify file existence
      const fileInfo = await FileSystem.getInfoAsync(image);
      console.log('File Info:', fileInfo);
      if (!fileInfo.exists) {
        throw new Error('Selected image file does not exist on device.');
      }

      // Upload using expo-file-system which natively handles boundaries and local URIs
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, image, {
        fieldName: 'file',
        httpMethod: 'POST',
        uploadType: 1, // FileSystemUploadType.MULTIPART enum value is 1
        parameters: {
          category: category,
          ...(color ? { color } : {}),
          ...(description ? { description } : {}),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Upload Result Status:', uploadResult.status);
      console.log('Upload Result Body:', uploadResult.body);

      if (uploadResult.status !== 200 && uploadResult.status !== 201) {
        let errorMsg = 'Upload failed';
        try {
          const parsed = JSON.parse(uploadResult.body);
          if (parsed.detail) errorMsg = parsed.detail;
        } catch (e) { }
        throw new Error(errorMsg);
      }

      console.log('Upload successful, navigating back...');
      Alert.alert('Success', 'Item added to your closet!', [
        { text: 'OK', onPress: () => router.push('/(tabs)') }
      ]);
    } catch (error: any) {
      console.error('Full Upload Error Object:', error);
      if (error.response) {
        console.error('Error Response Data:', error.response.data);
      }
      console.error('Upload Error Message:', error.message);
      Alert.alert('Upload Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
          <X size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Item</Text>
        <TouchableOpacity
          onPress={handleUpload}
          disabled={loading || !image}
          style={styles.headerAction}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={[
              styles.saveText,
              !image && styles.disabledText
            ]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Image Selection Area */}
        <View style={styles.imageSection}>
          {image ? (
            <View style={styles.selectedImageContainer}>
              <Image source={{ uri: image }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImage(null)}
              >
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <View style={styles.uploadButtonsRow}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={takePhoto}
                >
                  <Camera size={28} color="#1F2937" />
                  <Text style={styles.uploadButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickImage}
                >
                  <UploadCloud size={28} color="#1F2937" />
                  <Text style={styles.uploadButtonText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.placeholderText}>Take a photo or choose from gallery</Text>
            </View>
          )}
        </View>

        {/* Item Details Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Item Details</Text>

          <View style={styles.inputGroup}>
            <LayoutGrid size={20} color="#6B7280" />
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Category (e.g., T-Shirt, Jeans)</Text>
              <TextInput
                placeholder="Enter category"
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Palette size={20} color="#6B7280" />
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Color Options</Text>
              <TextInput
                placeholder="Enter color (optional)"
                style={styles.input}
                value={color}
                onChangeText={setColor}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={[styles.inputGroup, styles.alignItemsStart]}>
            <FileText size={20} color="#6B7280" style={styles.iconMarginTop} />
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                placeholder="Add notes about this item (optional)"
                style={[styles.input, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  } as ViewStyle,
  headerAction: {
    padding: 8,
    minWidth: 40,
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
    color: '#9CA3AF',
  } as TextStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingBottom: 40,
  } as ViewStyle,
  imageSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  } as ViewStyle,
  selectedImageContainer: {
    width: '100%',
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  selectedImage: {
    width: '100%',
    aspectRatio: 1,
  } as ImageStyle,
  removeImageButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 100,
  } as ViewStyle,
  uploadPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F3FF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#7C3AED',
    opacity: 0.8,
  } as ViewStyle,
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 24,
  } as ViewStyle,
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    marginTop: 4,
  } as TextStyle,
  placeholderText: {
    color: '#9CA3AF',
    marginTop: 24,
    fontWeight: '500',
  } as TextStyle,
  formContainer: {
    paddingHorizontal: 24,
    gap: 16,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  } as TextStyle,
  inputGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    // Shadow
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  inputWrapper: {
    flex: 1,
    marginLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#F5F3FF',
    paddingLeft: 12,
  } as ViewStyle,
  inputLabel: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
    marginBottom: 4,
  } as TextStyle,
  input: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    paddingVertical: 0,
  } as TextStyle,
  multilineInput: {
    height: 80,
  } as TextStyle,
  alignItemsStart: {
    alignItems: 'flex-start',
  } as ViewStyle,
  iconMarginTop: {
    marginTop: 4,
  } as ViewStyle,
});
