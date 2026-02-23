import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyRound, Mail } from 'lucide-react-native';
import api from '../../services/api';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        email,
        password,
      });

      Alert.alert('Success', 'Account created! Please sign in.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') },
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Registration Failed', error.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center">
        <View className="mb-10">
          <Text className="text-4xl font-bold text-gray-900">Create Account</Text>
          <Text className="text-gray-500 mt-2">Join the smart fashion movement</Text>
        </View>

        <View className="space-y-4">
          <View className="flex-row items-center border-b border-gray-200 pb-2 mb-4">
            <Mail size={20} color="#6B7280" />
            <TextInput
              placeholder="Email"
              className="flex-1 ml-3 text-lg"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="flex-row items-center border-b border-gray-200 pb-2 mb-4">
            <KeyRound size={20} color="#6B7280" />
            <TextInput
              placeholder="Password"
              className="flex-1 ml-3 text-lg"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View className="flex-row items-center border-b border-gray-200 pb-2 mb-8">
            <KeyRound size={20} color="#6B7280" />
            <TextInput
              placeholder="Confirm Password"
              className="flex-1 ml-3 text-lg"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          className="bg-black py-4 rounded-xl items-center"
          onPress={handleRegister}
          disabled={loading}
        >
          <Text className="text-white text-lg font-semibold">
            {loading ? 'Creating Account...' : 'Register'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text className="text-black font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
