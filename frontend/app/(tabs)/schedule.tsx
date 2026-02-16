import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { Colors } from '@/constants/colors';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ScheduleShow {
  id: number;
  show_name: string;
  description: string;
  start_time: string;
  end_time: string;
  permanent: boolean;
  excluded_dates: string[] | null;
  presenter: {
    username: string;
    bio: string;
    profile_photo?: {
      url: string;
    };
  } | null;
}

export default function ScheduleScreen() {
  const [schedule, setSchedule] = useState<ScheduleShow[]>([]);
  const [filteredSchedule, setFilteredSchedule] = useState<ScheduleShow[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  useEffect(() => {
    filterScheduleByDay(selectedDay);
  }, [selectedDay, schedule]);

  const fetchSchedule = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get(`${BACKEND_URL}/api/schedule`, {
        timeout: 10000,
      });

      if (response.data.success && response.data.data) {
        const shows = response.data.data.map((item: any) => ({
          id: item.id,
          show_name: item.show_name,
          description: item.description || '',
          start_time: item.start_time,
          end_time: item.end_time,
          permanent: item.permanent || false,
          excluded_dates: item.excluded_dates || null,
          presenter: item.users_permissions_user ? {
            username: item.users_permissions_user.username,
            bio: item.users_permissions_user.bio || '',
            profile_photo: item.users_permissions_user.profile_photo,
          } : null,
        }));
        
        setSchedule(shows);
      } else {
        setError('Failed to load schedule');
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('Could not load schedule. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterScheduleByDay = (dayIndex: number) => {
    // Get the target date for the selected day
    const today = new Date();
    const currentDay = today.getDay();
    
    // Calculate how many days to add to get to the selected day this week
    let daysToAdd = dayIndex - currentDay;
    if (daysToAdd < 0) {
      daysToAdd += 7; // If the day has passed this week, show next week
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    targetDate.setHours(0, 0, 0, 0);
    
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);

    console.log('Filtering for date:', targetDate.toISOString());

    // Filter shows
    const filtered = schedule.filter((show) => {
      const showDate = new Date(show.start_time);
      const showDateOnly = new Date(showDate);
      showDateOnly.setHours(0, 0, 0, 0);
      
      // Check if show date matches target date
      const isSameDate = showDateOnly.getTime() === targetDate.getTime();
      
      // For permanent shows, check if they occur on this day of week
      // and are not in excluded dates
      if (show.permanent) {
        const isCorrectDayOfWeek = showDate.getDay() === dayIndex;
        
        // Check if this specific date is excluded
        let isExcluded = false;
        if (show.excluded_dates && Array.isArray(show.excluded_dates)) {
          isExcluded = show.excluded_dates.some((excludedDate: string) => {
            const excluded = new Date(excludedDate);
            excluded.setHours(0, 0, 0, 0);
            return excluded.getTime() === targetDate.getTime();
          });
        }
        
        return isCorrectDayOfWeek && !isExcluded;
      }
      
      // For non-permanent shows, only show if the date matches exactly
      return isSameDate;
    });

    // Sort by start time
    filtered.sort((a, b) => {
      const timeA = new Date(a.start_time).getTime();
      const timeB = new Date(b.start_time).getTime();
      return timeA - timeB;
    });

    console.log(`Found ${filtered.length} shows for ${DAYS[dayIndex]}`);
    setFilteredSchedule(filtered);
  };

  const formatTime = (isoTime: string) => {
    const date = new Date(isoTime);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchSchedule();
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSchedule}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Show Schedule</Text>
        <Text style={styles.subtitle}>
          {DAYS[selectedDay]}'s lineup
        </Text>
      </View>

      {/* Day Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {DAYS.map((day, index) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              selectedDay === index && styles.dayButtonActive,
              index < DAYS.length - 1 && { marginRight: 8 },
            ]}
            onPress={() => setSelectedDay(index)}
          >
            <Text
              style={[
                styles.dayButtonText,
                selectedDay === index && styles.dayButtonTextActive,
              ]}
            >
              {day.substring(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Schedule List */}
      <ScrollView
        style={styles.scheduleList}
        contentContainerStyle={styles.scheduleListContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {filteredSchedule.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No shows scheduled for {DAYS[selectedDay]}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Check other days or pull to refresh
            </Text>
          </View>
        ) : (
          filteredSchedule.map((show, index) => (
            <View 
              key={show.id} 
              style={[
                styles.showCard,
                index < filteredSchedule.length - 1 && { marginBottom: 16 }
              ]}
            >
              {/* Time Badge */}
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>
                  {formatTime(show.start_time)}
                </Text>
                <Text style={styles.timeSeparator}>-</Text>
                <Text style={styles.timeText}>
                  {formatTime(show.end_time)}
                </Text>
              </View>

              {/* Show Content */}
              <View style={styles.showContent}>
                <Text style={styles.showName}>{show.show_name}</Text>
                
                {show.description && (
                  <Text style={styles.showDescription} numberOfLines={2}>
                    {show.description}
                  </Text>
                )}

                {/* Presenter Info */}
                {show.presenter && (
                  <View style={styles.presenterInfo}>
                    {show.presenter.profile_photo && (
                      <Image
                        source={{
                          uri: `https://www.trucksim.fm${show.presenter.profile_photo.url}`,
                        }}
                        style={styles.presenterPhoto}
                      />
                    )}
                    <View style={styles.presenterDetails}>
                      <Text style={styles.presenterName}>
                        {show.presenter.username}
                      </Text>
                      {show.presenter.bio && (
                        <Text style={styles.presenterBio} numberOfLines={1}>
                          {show.presenter.bio}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  daySelector: {
    maxHeight: 60,
    marginBottom: 16,
  },
  daySelectorContent: {
    paddingHorizontal: 16,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dayButtonTextActive: {
    color: Colors.text,
  },
  scheduleList: {
    flex: 1,
  },
  scheduleListContent: {
    padding: 16,
  },
  showCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  timeSeparator: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  showContent: {
    gap: 8,
  },
  showName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  showDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  presenterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  presenterPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
  },
  presenterDetails: {
    flex: 1,
  },
  presenterName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  presenterBio: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
