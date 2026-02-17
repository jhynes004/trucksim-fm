import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

// Default auto-DJ when no live show
const AUTO_DJ = {
  name: 'DJ Cruise Control',
  description: 'Full throttle tunes...',
  showName: 'Auto DJ',
  photoUrl: 'https://trucksim.fm/uploads/DJ_Cruise_Control_62185ad8f6.png',
  isAutoDJ: true,
};

export interface LivePresenter {
  name: string;
  description: string;
  showName: string;
  photoUrl: string | null;
  isAutoDJ: boolean;
  endTime?: string;
}

export interface ScheduleItem {
  show_name: string;
  description: string;
  start_time: string;
  end_time: string;
  permanent: boolean;
  perm_end: string | null;
  excluded_dates?: string[];
  users_permissions_user: {
    username: string;
    profile_photo?: {
      url: string;
    };
  } | null;
}

/**
 * Check if a show is currently live based on UTC time
 */
const isShowLiveNow = (show: ScheduleItem, now: Date): boolean => {
  const startTime = new Date(show.start_time);
  const endTime = new Date(show.end_time);
  
  const nowHours = now.getUTCHours();
  const nowMinutes = now.getUTCMinutes();
  const nowTotalMinutes = nowHours * 60 + nowMinutes;
  
  const startHours = startTime.getUTCHours();
  const startMinutes = startTime.getUTCMinutes();
  const startTotalMinutes = startHours * 60 + startMinutes;
  
  const endHours = endTime.getUTCHours();
  const endMinutes = endTime.getUTCMinutes();
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  // Check if current time is within the show's time slot
  const isWithinTime = nowTotalMinutes >= startTotalMinutes && nowTotalMinutes < endTotalMinutes;
  
  // Check day of week (getUTCDay: 0=Sun, 1=Mon, ..., 6=Sat)
  const nowDay = now.getUTCDay();
  const showDay = startTime.getUTCDay();
  const isSameDay = nowDay === showDay;
  
  if (show.permanent) {
    // For permanent shows, check if perm_end has passed
    if (show.perm_end) {
      const permEndDate = new Date(show.perm_end);
      if (permEndDate < now) {
        return false; // Show has ended
      }
    }
    
    // Check excluded dates
    if (show.excluded_dates && Array.isArray(show.excluded_dates)) {
      const isExcluded = show.excluded_dates.some(dateStr => {
        const excluded = new Date(dateStr);
        return excluded.getUTCFullYear() === now.getUTCFullYear() &&
               excluded.getUTCMonth() === now.getUTCMonth() &&
               excluded.getUTCDate() === now.getUTCDate();
      });
      if (isExcluded) return false;
    }
    
    return isSameDay && isWithinTime;
  } else {
    // For non-permanent (one-time) shows, check if it's TODAY specifically
    const isSameDate = 
      now.getUTCFullYear() === startTime.getUTCFullYear() &&
      now.getUTCMonth() === startTime.getUTCMonth() &&
      now.getUTCDate() === startTime.getUTCDate();
    
    return isSameDate && isWithinTime;
  }
};

/**
 * Fetch the current live presenter from schedule data
 */
export const getLivePresenter = async (): Promise<LivePresenter> => {
  try {
    console.log('[PresenterService] Fetching schedule for live presenter');
    
    const response = await axios.get(`${BACKEND_URL}/api/schedule`, {
      timeout: 10000,
    });
    
    if (!response.data?.success || !Array.isArray(response.data?.data)) {
      console.log('[PresenterService] Invalid schedule response');
      return AUTO_DJ;
    }
    
    const scheduleData = response.data.data as ScheduleItem[];
    const now = new Date();
    
    console.log(`[PresenterService] Current UTC: ${now.toISOString()}`);
    console.log(`[PresenterService] Day: ${now.getUTCDay()}, Hour: ${now.getUTCHours()}:${now.getUTCMinutes()}`);
    
    // Find all shows that are live right now
    const liveShows = scheduleData.filter(show => {
      // Must have a presenter
      if (!show.users_permissions_user?.username) return false;
      return isShowLiveNow(show, now);
    });
    
    console.log(`[PresenterService] Found ${liveShows.length} potentially live shows`);
    
    if (liveShows.length === 0) {
      console.log('[PresenterService] No live shows, returning auto-DJ');
      return AUTO_DJ;
    }
    
    // Priority: One-time shows for TODAY take precedence over permanent shows
    // Then prefer shows with meaningful names over generic ones
    // Then by start time (later start time = more specific)
    const sortedShows = liveShows.sort((a, b) => {
      // One-time shows first
      if (!a.permanent && b.permanent) return -1;
      if (a.permanent && !b.permanent) return 1;
      
      // Prefer shows with actual show names over generic ones
      const aHasName = a.show_name && a.show_name.trim().length > 0;
      const bHasName = b.show_name && b.show_name.trim().length > 0;
      if (aHasName && !bHasName) return -1;
      if (!aHasName && bHasName) return 1;
      
      // Then by end time (earlier end time = more specific to current hour)
      const aEnd = new Date(a.end_time).getUTCHours() * 60 + new Date(a.end_time).getUTCMinutes();
      const bEnd = new Date(b.end_time).getUTCHours() * 60 + new Date(b.end_time).getUTCMinutes();
      return aEnd - bEnd;
    });
    
    // Pick the first (highest priority) show
    const liveShow = sortedShows[0];
    const presenter = liveShow.users_permissions_user!;
    const photoUrl = presenter.profile_photo?.url 
      ? `https://trucksim.fm${presenter.profile_photo.url}`
      : null;
    
    console.log(`[PresenterService] Selected show: ${liveShow.show_name} by ${presenter.username}`);
    
    return {
      name: presenter.username,
      description: liveShow.description || '',
      showName: liveShow.show_name || `Live with ${presenter.username}`,
      photoUrl,
      isAutoDJ: false,
      endTime: liveShow.end_time,
    };
    
  } catch (error) {
    console.error('[PresenterService] Error:', error);
    return AUTO_DJ;
  }
};
