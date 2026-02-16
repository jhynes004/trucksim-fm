import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

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
 * Check if a permanent show has ended based on perm_end field
 */
const isPermanentShowEnded = (show: ScheduleItem, now: Date): boolean => {
  if (!show.perm_end) return false;
  const permEndDate = new Date(show.perm_end);
  return permEndDate < now;
};

/**
 * Check if a date is excluded for a permanent show
 */
const isDateExcluded = (show: ScheduleItem, targetDate: Date): boolean => {
  if (!show.excluded_dates || !Array.isArray(show.excluded_dates)) return false;
  
  return show.excluded_dates.some(excludedDateStr => {
    const excluded = new Date(excludedDateStr);
    return excluded.getUTCFullYear() === targetDate.getUTCFullYear() &&
           excluded.getUTCMonth() === targetDate.getUTCMonth() &&
           excluded.getUTCDate() === targetDate.getUTCDate();
  });
};

/**
 * Check if a show is currently live based on UTC time
 */
const isShowLive = (show: ScheduleItem, now: Date): boolean => {
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
  
  const isWithinTime = nowTotalMinutes >= startTotalMinutes && nowTotalMinutes < endTotalMinutes;
  
  if (show.permanent) {
    // For permanent shows:
    // 1. Check if perm_end has passed
    if (isPermanentShowEnded(show, now)) {
      return false;
    }
    
    // 2. Check if today's date is excluded
    if (isDateExcluded(show, now)) {
      return false;
    }
    
    // 3. Check if day of week matches (UTC)
    // getUTCDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const nowDay = now.getUTCDay();
    const showDay = startTime.getUTCDay();
    
    return nowDay === showDay && isWithinTime;
  } else {
    // For non-permanent (one-time) shows:
    // Check if the show is for TODAY specifically (same UTC date)
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
    console.log('[PresenterService] Fetching schedule for live presenter check');
    
    const response = await axios.get(`${BACKEND_URL}/api/schedule`, {
      timeout: 10000,
    });
    
    if (!response.data || !response.data.success || !Array.isArray(response.data.data)) {
      console.log('[PresenterService] Invalid schedule response, returning auto-DJ');
      return AUTO_DJ;
    }
    
    const scheduleData = response.data.data as ScheduleItem[];
    const now = new Date();
    
    console.log(`[PresenterService] Current UTC: ${now.toISOString()}`);
    console.log(`[PresenterService] UTC Day: ${now.getUTCDay()}, Hour: ${now.getUTCHours()}:${now.getUTCMinutes()}`);
    
    // Filter to only shows with a presenter
    const showsWithPresenter = scheduleData.filter(show => 
      show.users_permissions_user && show.users_permissions_user.username
    );
    
    // First check non-permanent (one-time) shows for TODAY - they take priority
    for (const show of showsWithPresenter) {
      if (show.permanent) continue;
      if (isShowLive(show, now)) {
        const presenter = show.users_permissions_user!;
        const photoUrl = presenter.profile_photo?.url 
          ? `https://trucksim.fm${presenter.profile_photo.url}`
          : null;
        
        console.log('[PresenterService] Found ONE-TIME live show:', show.show_name, 'by', presenter.username);
        
        return {
          name: presenter.username,
          description: show.description || '',
          showName: show.show_name || `Live with ${presenter.username}`,
          photoUrl,
          isAutoDJ: false,
          endTime: show.end_time,
        };
      }
    }
    
    // Then check permanent shows
    for (const show of showsWithPresenter) {
      if (!show.permanent) continue;
      if (isShowLive(show, now)) {
        const presenter = show.users_permissions_user!;
        const photoUrl = presenter.profile_photo?.url 
          ? `https://trucksim.fm${presenter.profile_photo.url}`
          : null;
        
        console.log('[PresenterService] Found PERMANENT live show:', show.show_name, 'by', presenter.username);
        
        return {
          name: presenter.username,
          description: show.description || '',
          showName: show.show_name || `Live with ${presenter.username}`,
          photoUrl,
          isAutoDJ: false,
          endTime: show.end_time,
        };
      }
    }
    
    console.log('[PresenterService] No live show found, returning auto-DJ');
    return AUTO_DJ;
    
  } catch (error) {
    console.error('[PresenterService] Error fetching live presenter:', error);
    return AUTO_DJ;
  }
};
