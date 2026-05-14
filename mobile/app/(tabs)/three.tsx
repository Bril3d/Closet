import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
  Dimensions, Image, TouchableOpacity, ViewStyle, TextStyle
} from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { BarChart3, TrendingUp, Shirt, Heart, Palette, Sparkles, Moon } from 'lucide-react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');

const CHART_COLORS = [
  '#7C3AED', '#3B82F6', '#EC4899', '#F97316', '#22C55E',
  '#EAB308', '#14B8A6', '#EF4444', '#8B5CF6', '#6366F1',
];

interface Summary {
  total_items: number;
  total_outfits: number;
  total_favorites: number;
  total_categories: number;
  total_value: number;
  avg_cost_per_wear: number;
  style_score: number;
}

interface CategoryData {
  category: string;
  count: number;
}

interface ColorData {
  color: string;
  hex: string;
  count: number;
}

interface SleepingItem {
  id: string;
  category: string;
  color: string;
  image_url: string;
  days_since_added: number;
}

export default function InsightsScreen() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [colors, setColors] = useState<ColorData[]>([]);
  const [sleepingItems, setSleepingItems] = useState<SleepingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const token = useAuthStore((state) => state.token);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [sumRes, catRes, colRes, sleepRes] = await Promise.all([
        api.get('/analytics/summary', { headers }),
        api.get('/analytics/category-distribution', { headers }),
        api.get('/analytics/color-distribution', { headers }),
        api.get('/analytics/sleeping-items', { headers }),
      ]);
      setSummary(sumRes.data);
      setCategories(catRes.data);
      setColors(colRes.data);
      setSleepingItems(sleepRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  // Prepare pie chart data
  const pieData = categories.map((cat, i) => ({
    value: cat.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
    text: `${cat.count}`,
    label: cat.category,
  }));

  const totalItems = summary?.total_items || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Insights</Text>
          <Text style={styles.headerSubtitle}>Your wardrobe analytics</Text>
        </View>

        {/* Style Score Card */}
        {summary && (
          <View style={styles.scoreCard}>
            <View style={styles.scoreCircle}>
              <Sparkles size={24} color="#FFFFFF" />
              <Text style={styles.scoreValue}>{summary.style_score}</Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreTitle}>Style Score</Text>
              <Text style={styles.scoreDesc}>
                Based on category variety, color diversity, and outfit creativity
              </Text>
            </View>
          </View>
        )}

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#F5F3FF' }]}>
            <Shirt size={24} color="#7C3AED" />
            <Text style={styles.summaryValue}>{summary?.total_items || 0}</Text>
            <Text style={styles.summaryLabel}>Items</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FFF7ED' }]}>
            <BarChart3 size={24} color="#F97316" />
            <Text style={styles.summaryValue}>{summary?.total_outfits || 0}</Text>
            <Text style={styles.summaryLabel}>Outfits</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2' }]}>
            <Heart size={24} color="#EF4444" />
            <Text style={styles.summaryValue}>{summary?.total_favorites || 0}</Text>
            <Text style={styles.summaryLabel}>Favorites</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#ECFDF5' }]}>
            <TrendingUp size={24} color="#22C55E" />
            <Text style={styles.summaryValue}>${summary?.total_value?.toFixed(0) || '0'}</Text>
            <Text style={styles.summaryLabel}>Value</Text>
          </View>
        </View>

        {/* Category Distribution */}
        {pieData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Wardrobe Composition</Text>
            <View style={styles.pieContainer}>
              <PieChart
                data={pieData}
                donut
                radius={90}
                innerRadius={55}
                innerCircleColor="#FFFFFF"
                centerLabelComponent={() => (
                  <View style={styles.pieCenterLabel}>
                    <Text style={styles.pieCenterValue}>{totalItems}</Text>
                    <Text style={styles.pieCenterText}>Items</Text>
                  </View>
                )}
              />
            </View>
            {/* Legend */}
            <View style={styles.legendContainer}>
              {categories.map((cat, i) => (
                <View key={cat.category} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
                  <Text style={styles.legendText}>{cat.category}</Text>
                  <Text style={styles.legendCount}>{cat.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Color Palette */}
        {colors.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.sectionHeader}>
              <Palette size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Color Palette</Text>
            </View>
            <View style={styles.colorGrid}>
              {colors.map((c) => (
                <View key={c.color} style={styles.colorItem}>
                  <View style={[styles.colorSwatch, { backgroundColor: c.hex, borderWidth: c.color === 'White' ? 1 : 0, borderColor: '#E5E7EB' }]} />
                  <Text style={styles.colorName}>{c.color}</Text>
                  <Text style={styles.colorCount}>{c.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sleeping Items */}
        {sleepingItems.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.sectionHeader}>
              <Moon size={20} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Sleeping Items</Text>
            </View>
            <Text style={styles.sleepingDesc}>
              These items have never been used in an outfit. Time to wake them up! 👋
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sleepingScroll}>
              {sleepingItems.map((item) => (
                <View key={item.id} style={styles.sleepingCard}>
                  <Image source={{ uri: item.image_url }} style={styles.sleepingImage} resizeMode="cover" />
                  <Text style={styles.sleepingCategory}>{item.category}</Text>
                  <Text style={styles.sleepingDays}>{item.days_since_added}d asleep</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Cost Per Wear */}
        {summary && summary.avg_cost_per_wear > 0 && (
          <View style={[styles.chartCard, { backgroundColor: '#F5F3FF' }]}>
            <Text style={styles.sectionTitle}>💰 Average Cost Per Wear</Text>
            <Text style={styles.cpwValue}>${summary.avg_cost_per_wear.toFixed(2)}</Text>
            <Text style={styles.cpwDesc}>
              Lower is better! Add prices to your items and create more outfits to improve.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' } as ViewStyle,
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' } as ViewStyle,
  loadingText: { marginTop: 12, fontSize: 16, color: '#9CA3AF' } as TextStyle,
  scrollContent: { paddingBottom: 20 } as ViewStyle,
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 } as ViewStyle,
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#111827' } as TextStyle,
  headerSubtitle: { fontSize: 16, color: '#9CA3AF', marginTop: 4 } as TextStyle,

  // Style Score
  scoreCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 24,
    marginTop: 16, padding: 20, borderRadius: 20,
    backgroundColor: '#7C3AED', gap: 16,
  } as ViewStyle,
  scoreCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  } as ViewStyle,
  scoreValue: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 2 } as TextStyle,
  scoreLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)' } as TextStyle,
  scoreInfo: { flex: 1 } as ViewStyle,
  scoreTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' } as TextStyle,
  scoreDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, lineHeight: 18 } as TextStyle,

  // Summary Grid
  summaryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24,
    marginTop: 16, gap: 12,
  } as ViewStyle,
  summaryCard: {
    width: (width - 48 - 12) / 2, padding: 16, borderRadius: 16,
    alignItems: 'center', gap: 8,
  } as ViewStyle,
  summaryValue: { fontSize: 24, fontWeight: '800', color: '#111827' } as TextStyle,
  summaryLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' } as TextStyle,

  // Chart Cards
  chartCard: {
    marginHorizontal: 24, marginTop: 20, padding: 20,
    borderRadius: 20, backgroundColor: '#FAFAFA',
    borderWidth: 1, borderColor: '#F3F4F6',
  } as ViewStyle,
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 } as ViewStyle,
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 } as TextStyle,

  // Pie Chart
  pieContainer: { alignItems: 'center', marginVertical: 8 } as ViewStyle,
  pieCenterLabel: { alignItems: 'center' } as ViewStyle,
  pieCenterValue: { fontSize: 28, fontWeight: '800', color: '#7C3AED' } as TextStyle,
  pieCenterText: { fontSize: 12, color: '#9CA3AF' } as TextStyle,

  // Legend
  legendContainer: { marginTop: 16, gap: 8 } as ViewStyle,
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 } as ViewStyle,
  legendDot: { width: 12, height: 12, borderRadius: 6 } as ViewStyle,
  legendText: { flex: 1, fontSize: 14, color: '#4B5563', fontWeight: '500' } as TextStyle,
  legendCount: { fontSize: 14, fontWeight: '700', color: '#111827' } as TextStyle,

  // Color Palette
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 8 } as ViewStyle,
  colorItem: { alignItems: 'center', gap: 4 } as ViewStyle,
  colorSwatch: { width: 44, height: 44, borderRadius: 22 } as ViewStyle,
  colorName: { fontSize: 11, color: '#6B7280', fontWeight: '500' } as TextStyle,
  colorCount: { fontSize: 12, fontWeight: '700', color: '#111827' } as TextStyle,

  // Sleeping Items
  sleepingDesc: { fontSize: 14, color: '#6B7280', marginBottom: 12, marginTop: -8, lineHeight: 20 } as TextStyle,
  sleepingScroll: { marginHorizontal: -4 } as ViewStyle,
  sleepingCard: {
    width: 110, marginRight: 12, alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 8,
    borderWidth: 1, borderColor: '#F3F4F6',
  } as ViewStyle,
  sleepingImage: { width: 90, height: 90, borderRadius: 10, backgroundColor: '#F3F4F6' } as ViewStyle,
  sleepingCategory: { fontSize: 12, fontWeight: '600', color: '#111827', marginTop: 6 } as TextStyle,
  sleepingDays: { fontSize: 11, color: '#EF4444', fontWeight: '500' } as TextStyle,

  // Cost Per Wear
  cpwValue: { fontSize: 36, fontWeight: '800', color: '#7C3AED', textAlign: 'center', marginTop: -8 } as TextStyle,
  cpwDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 18 } as TextStyle,
});
