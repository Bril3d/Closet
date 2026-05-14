import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Cloud, Sun, Search, MapPin, Droplets, Wind, Thermometer, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function StylistScreen() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weather'>('daily');
  const [loading, setLoading] = useState(false);
  const [dailyOutfit, setDailyOutfit] = useState<any>(null);
  
  // Weather state
  const [city, setCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherOutfit, setWeatherOutfit] = useState<any>(null);
  const [weatherError, setWeatherError] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    fetchDailyOutfit();
  }, []);

  const fetchDailyOutfit = async () => {
    setLoading(true);
    try {
      const response = await api.get('/suggestions/outfit', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDailyOutfit(response.data);
    } catch (error) {
      console.error('Failed to fetch daily outfit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (text: string) => {
    setCity(text);
    setShowSuggestions(true);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (text.trim().length >= 2) {
      setIsSearchingCity(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await api.get(`/suggestions/cities?query=${encodeURIComponent(text)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCitySuggestions(response.data);
        } catch (error) {
          console.error('Failed to fetch cities:', error);
        } finally {
          setIsSearchingCity(false);
        }
      }, 500); // 500ms debounce
    } else {
      setCitySuggestions([]);
      setIsSearchingCity(false);
    }
  };

  const handleCitySelect = (selectedCity: any) => {
    setCity(selectedCity.name);
    setShowSuggestions(false);
    // Automatically fetch weather when a city is selected
    fetchWeatherSuggestionForCity(selectedCity.name);
  };

  const fetchWeatherSuggestionForCity = async (cityName: string) => {
    if (!cityName.trim()) return;
    setLoading(true);
    setWeatherError('');
    setShowSuggestions(false);
    try {
      const response = await api.get(`/suggestions/weather?city=${encodeURIComponent(cityName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeatherData(response.data.weather);
      setWeatherOutfit(response.data.recommendation);
    } catch (error: any) {
      console.error('Failed to fetch weather suggestion:', error);
      setWeatherError(error.response?.data?.detail || 'Could not fetch weather data for this city.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherSuggestion = () => {
    fetchWeatherSuggestionForCity(city);
  };

  const renderOutfitItems = (items: any[]) => {
    if (!items || items.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No items found for this suggestion.</Text>
        </View>
      );
    }

    return (
      <View style={styles.outfitGrid}>
        {items.map((item, index) => (
          <TouchableOpacity 
            key={item.id || index} 
            style={styles.outfitItemCard}
            onPress={() => router.push(`/items/${item.id}`)}
          >
            <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="cover" />
            <View style={styles.itemDetails}>
              <Text style={styles.itemCategory}>{item.category || 'Item'}</Text>
              <Text style={styles.itemColor}>{item.color}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Stylist</Text>
        <Sparkles size={24} color="#7C3AED" />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'daily' && styles.activeTabButton]}
          onPress={() => setActiveTab('daily')}
        >
          <Sparkles size={16} color={activeTab === 'daily' ? "#FFF" : "#6B7280"} />
          <Text style={[styles.tabText, activeTab === 'daily' && styles.activeTabText]}>Daily Mix</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'weather' && styles.activeTabButton]}
          onPress={() => setActiveTab('weather')}
        >
          <Cloud size={16} color={activeTab === 'weather' ? "#FFF" : "#6B7280"} />
          <Text style={[styles.tabText, activeTab === 'weather' && styles.activeTabText]}>Weather Match</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'daily' ? (
          <View style={styles.contentSection}>
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>Your Daily Inspiration</Text>
              <Text style={styles.introDesc}>AI-crafted outfits based on color harmony and item rotation from your closet.</Text>
            </View>

            {loading && !dailyOutfit ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={styles.loadingText}>Styling your outfit...</Text>
              </View>
            ) : dailyOutfit ? (
              <View style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <Text style={styles.suggestionReason}>{dailyOutfit.reason}</Text>
                  {dailyOutfit.color_palette && (
                    <View style={styles.paletteContainer}>
                      {dailyOutfit.color_palette.map((color: string, idx: number) => (
                        <View key={idx} style={[styles.colorDot, { backgroundColor: color.toLowerCase() === 'white' ? '#f3f4f6' : color.toLowerCase() }]} />
                      ))}
                    </View>
                  )}
                </View>
                {renderOutfitItems(dailyOutfit.items)}
                
                <TouchableOpacity style={styles.refreshButton} onPress={fetchDailyOutfit}>
                  <Text style={styles.refreshButtonText}>Generate Another</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.contentSection}>
            <View style={styles.searchContainerWrapper}>
              <View style={styles.searchSection}>
                <View style={styles.searchInputContainer}>
                  <MapPin size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Enter a city (e.g. London)"
                    value={city}
                    onChangeText={handleCityChange}
                    onSubmitEditing={fetchWeatherSuggestion}
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => { if (city.length >= 2) setShowSuggestions(true); }}
                  />
                </View>
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={fetchWeatherSuggestion}
                  disabled={loading || !city.trim()}
                >
                  {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Search size={20} color="#FFF" />}
                </TouchableOpacity>
              </View>

              {/* Autocomplete Dropdown */}
              {showSuggestions && (city.length >= 2) && (
                <View style={styles.suggestionsDropdown}>
                  {isSearchingCity ? (
                    <View style={styles.suggestionItem}>
                      <ActivityIndicator size="small" color="#7C3AED" />
                      <Text style={styles.suggestionText}>Searching...</Text>
                    </View>
                  ) : citySuggestions.length > 0 ? (
                    citySuggestions.map((suggestion, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={[styles.suggestionItem, index !== citySuggestions.length - 1 && styles.suggestionBorder]}
                        onPress={() => handleCitySelect(suggestion)}
                      >
                        <MapPin size={16} color="#6B7280" />
                        <Text style={styles.suggestionText}>{suggestion.display_name}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.suggestionItem}>
                      <Text style={styles.suggestionText}>No cities found</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {weatherError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{weatherError}</Text>
              </View>
            ) : null}

            {weatherData && weatherOutfit && (
              <View style={styles.weatherResultContainer}>
                <View style={styles.weatherCard}>
                  <View style={styles.weatherHeader}>
                    <Text style={styles.weatherCity}>{weatherData.city}</Text>
                    <Text style={styles.weatherDesc}>{weatherData.description.charAt(0).toUpperCase() + weatherData.description.slice(1)}</Text>
                  </View>
                  
                  <View style={styles.weatherMain}>
                    <Text style={styles.weatherTemp}>{Math.round(weatherData.temperature)}°C</Text>
                    <View style={styles.weatherIconContainer}>
                      {weatherData.temperature > 20 ? <Sun size={40} color="#F59E0B" /> : <Cloud size={40} color="#60A5FA" />}
                    </View>
                  </View>
                  
                  <View style={styles.weatherDetails}>
                    <View style={styles.weatherStat}>
                      <Thermometer size={16} color="#6B7280" />
                      <Text style={styles.weatherStatText}>Feels {Math.round(weatherData.feels_like)}°</Text>
                    </View>
                    <View style={styles.weatherStat}>
                      <Droplets size={16} color="#6B7280" />
                      <Text style={styles.weatherStatText}>{weatherData.humidity}%</Text>
                    </View>
                    <View style={styles.weatherStat}>
                      <Wind size={16} color="#6B7280" />
                      <Text style={styles.weatherStatText}>{weatherData.wind_speed}m/s</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.suggestionCard}>
                  <Text style={styles.suggestionTitle}>Weather-Optimized Outfit</Text>
                  <Text style={styles.suggestionReason}>{weatherOutfit.reason}</Text>
                  {renderOutfitItems(weatherOutfit.items)}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: '#111827',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  contentSection: {
    flex: 1,
  },
  introCard: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  introDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  suggestionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  suggestionHeader: {
    marginBottom: 20,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  suggestionReason: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    fontWeight: '500',
  },
  paletteContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  outfitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  outfitItemCard: {
    width: (width - 48 - 40 - 16) / 2, // math for 2 columns with padding
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
  },
  itemDetails: {
    padding: 12,
  },
  itemCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemColor: {
    fontSize: 12,
    color: '#6B7280',
  },
  refreshButton: {
    marginTop: 24,
    backgroundColor: '#F5F3FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  refreshButtonText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 14,
  },
  searchSection: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 54,
    fontSize: 16,
    color: '#111827',
  },
  searchButton: {
    width: 54,
    height: 54,
    backgroundColor: '#111827',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainerWrapper: {
    zIndex: 10,
    marginBottom: 24,
  },
  suggestionsDropdown: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  weatherResultContainer: {
    gap: 24,
  },
  weatherCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  weatherHeader: {
    marginBottom: 16,
  },
  weatherCity: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  weatherDesc: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  weatherMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  weatherTemp: {
    fontSize: 48,
    fontWeight: '800',
    color: '#111827',
  },
  weatherIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherStatText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
});
