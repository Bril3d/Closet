import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ViewStyle, TextStyle } from 'react-native';
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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the smart fashion movement</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#6B7280" />
            <TextInput
              placeholder="Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <KeyRound size={20} color="#6B7280" />
            <TextInput
              placeholder="Password"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={[styles.inputContainer, styles.passwordMargin]}>
            <KeyRound size={20} color="#6B7280" />
            <TextInput
              placeholder="Confirm Password"
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Register'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.footerAction}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  } as ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  } as ViewStyle,
  titleSection: {
    marginBottom: 40,
  } as ViewStyle,
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#7C3AED',
  } as TextStyle,
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  } as TextStyle,
  form: {
    marginBottom: 24,
  } as ViewStyle,
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
    paddingBottom: 8,
    marginBottom: 16,
  } as ViewStyle,
  passwordMargin: {
    marginBottom: 32,
  } as ViewStyle,
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    color: '#111827',
  } as TextStyle,
  button: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  buttonDisabled: {
    opacity: 0.7,
  } as ViewStyle,
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  } as TextStyle,
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  } as ViewStyle,
  footerText: {
    color: '#6B7280',
    fontSize: 16,
  } as TextStyle,
  footerAction: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
});

