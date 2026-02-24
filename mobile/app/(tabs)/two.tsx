import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LayoutGrid, Sparkles } from 'lucide-react-native';

export default function OutfitsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Outfits</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <LayoutGrid size={64} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyTitle}>No outfits yet</Text>
        <Text style={styles.emptySubtitle}>
          The AI Outfit Generator is coming soon! Soon you'll be able to automatically generate stylish outfits from your digital closet.
        </Text>

        <TouchableOpacity style={styles.button} disabled>
          <Sparkles size={20} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>
            Generate Outfit
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  } as ViewStyle,
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  } as ViewStyle,
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#7C3AED',
  } as TextStyle,
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  } as ViewStyle,
  iconCircle: {
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
  button: {
    backgroundColor: '#7C3AED',
    opacity: 0.8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  buttonIcon: {
    marginRight: 8,
  } as ViewStyle,
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
    marginLeft: 8,
  } as TextStyle,
});

