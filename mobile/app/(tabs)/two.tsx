import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { LayoutGrid, Sparkles } from 'lucide-react-native';

export default function OutfitsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-3xl font-bold text-gray-900">Outfits</Text>
      </View>

      <View className="flex-1 justify-center items-center px-10">
        <View className="bg-gray-100 p-8 rounded-full mb-6">
          <LayoutGrid size={64} color="#9CA3AF" />
        </View>
        <Text className="text-xl font-bold text-gray-900 mb-2">No outfits yet</Text>
        <Text className="text-gray-500 text-center mb-8">
          The AI Outfit Generator is coming soon! Soon you'll be able to automatically generate stylish outfits from your digital closet.
        </Text>

        <TouchableOpacity className="bg-black px-8 py-4 rounded-xl flex-row items-center cursor-not-allowed opacity-80" disabled>
          <Sparkles size={20} color="#FFF" className="mr-2" />
          <Text className="text-white font-semibold text-lg ml-2">
            Generate Outfit
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
