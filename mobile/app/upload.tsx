import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, SafeAreaView, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
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
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You've refused to allow this app to access your photos!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You've refused to allow this app to access your camera!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
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
      const formData = new FormData();

      // Get filename and type from uri
      const uriParts = image.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const fileName = image.split('/').pop() || `photo.${fileType}`;

      formData.append('file', {
        uri: image,
        name: fileName,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      } as any);

      // Append metadata
      formData.append('item_in', JSON.stringify({
        category,
        color,
        description,
      }));

      await api.post('/items/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert('Success', 'Item added to your closet!', [
        { text: 'OK', onPress: () => router.push('/(tabs)') }
      ]);
    } catch (error: any) {
      console.error('Upload Error:', error);
      Alert.alert('Upload Failed', error.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-6 pt-4 pb-2 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <X size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Add Item</Text>
        <TouchableOpacity
          onPress={handleUpload}
          disabled={loading || !image}
          className="p-2 -mr-2"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text className={`text-lg font-semibold ${image ? 'text-black' : 'text-gray-400'}`}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Image Selection Area */}
        <View className="px-6 py-6 items-center">
          {image ? (
            <View className="w-full relative rounded-3xl overflow-hidden shadow-sm">
              <Image source={{ uri: image }} className="w-full aspect-square" />
              <TouchableOpacity
                className="absolute top-4 right-4 bg-black/50 p-2 rounded-full"
                onPress={() => setImage(null)}
              >
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="w-full aspect-square bg-gray-200 rounded-3xl items-center justify-center border-2 border-dashed border-gray-300">
              <View className="flex-row space-x-6">
                <TouchableOpacity
                  className="items-center justify-center bg-white w-20 h-20 rounded-full shadow-sm"
                  onPress={takePhoto}
                >
                  <Camera size={28} color="#1F2937" />
                  <Text className="text-xs font-medium text-gray-600 mt-1">Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="items-center justify-center bg-white w-20 h-20 rounded-full shadow-sm"
                  onPress={pickImage}
                >
                  <UploadCloud size={28} color="#1F2937" />
                  <Text className="text-xs font-medium text-gray-600 mt-1">Gallery</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-gray-400 mt-6 font-medium">Take a photo or choose from gallery</Text>
            </View>
          )}
        </View>

        {/* Item Details Form */}
        <View className="px-6 space-y-4">
          <Text className="text-lg font-bold text-gray-900 mb-2">Item Details</Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center border border-gray-100">
            <LayoutGrid size={20} color="#6B7280" />
            <View className="flex-1 ml-3 border-l border-gray-100 pl-3">
              <Text className="text-xs text-gray-400 font-medium mb-1">Category (e.g., T-Shirt, Jeans)</Text>
              <TextInput
                placeholder="Enter category"
                className="text-base text-gray-900 font-medium"
                value={category}
                onChangeText={setCategory}
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center border border-gray-100">
            <Palette size={20} color="#6B7280" />
            <View className="flex-1 ml-3 border-l border-gray-100 pl-3">
              <Text className="text-xs text-gray-400 font-medium mb-1">Color Options</Text>
              <TextInput
                placeholder="Enter color (optional)"
                className="text-base text-gray-900 font-medium"
                value={color}
                onChangeText={setColor}
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-start border border-gray-100">
            <FileText size={20} color="#6B7280" className="mt-1" />
            <View className="flex-1 ml-3 border-l border-gray-100 pl-3">
              <Text className="text-xs text-gray-400 font-medium mb-1">Description</Text>
              <TextInput
                placeholder="Add notes about this item (optional)"
                className="text-base text-gray-900 font-medium"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
