import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Default auto-DJ when no live show
const AUTO_DJ = {
  name: 'DJ Cruise Control',
  description: 'Full throttle tunes...',
  showName: 'Auto DJ',
  photoUrl: null,
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
  users_permissions_user: {
    username: string;
    profile_photo?: {
      url: string;
    };
  } | null;
}

/**
 * Check if a show is currently live based on time
 * For permanent shows: match day of week and time
 * For non-permanent shows: must be TODAY (same date) and within time range
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
  
  if (show.permanent) {
    // For permanent/recurring shows, match by day of week and time only
    // getUTCDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const nowDay = now.getUTCDay();
    const showDay = startTime.getUTCDay();
    
    const isSameDay = nowDay === showDay;
    const isWithinTime = nowTotalMinutes >= startTotalMinutes && nowTotalMinutes < endTotalMinutes;
    
    return isSameDay && isWithinTime;
  } else {
    // For non-permanent (one-time) shows, check if it's TODAY specifically
    // Compare year, month, and date
    const isSameDate = 
      now.getUTCFullYear() === startTime.getUTCFullYear() &&
      now.getUTCMonth() === startTime.getUTCMonth() &&
      now.getUTCDate() === startTime.getUTCDate();
    
    const isWithinTime = nowTotalMinutes >= startTotalMinutes && nowTotalMinutes < endTotalMinutes;
    
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
    
    console.log(`[PresenterService] Current UTC: ${now.toISOString()}, Day: ${now.getUTCDay()}, Date: ${now.getUTCDate()}`);
    
    // Filter to only shows with a presenter
    const showsWithPresenter = scheduleData.filter(show => 
      show.users_permissions_user && show.users_permissions_user.username
    );
    
    // First, check for non-permanent shows TODAY (they take priority)
    const todayShow = showsWithPresenter.find(show => {
      if (show.permanent) return false;
      return isShowLive(show, now);
    });
    
    if (todayShow && todayShow.users_permissions_user) {
      const presenter = todayShow.users_permissions_user;
      const photoUrl = presenter.profile_photo?.url 
        ? `https://trucksim.fm${presenter.profile_photo.url}`
        : null;
      
      console.log('[PresenterService] Found TODAY live show:', todayShow.show_name, 'by', presenter.username);
      
      return {
        name: presenter.username,
        description: todayShow.description || '',
        showName: todayShow.show_name || `Live with ${presenter.username}`,
        photoUrl,
        isAutoDJ: false,
        endTime: todayShow.end_time,
      };
    }
    
    // Then, check permanent shows
    const permanentShow = showsWithPresenter.find(show => {
      if (!show.permanent) return false;
      return isShowLive(show, now);
    });
    
    if (permanentShow && permanentShow.users_permissions_user) {
      const presenter = permanentShow.users_permissions_user;
      const photoUrl = presenter.profile_photo?.url 
        ? `https://trucksim.fm${presenter.profile_photo.url}`
        : null;
      
      console.log('[PresenterService] Found PERMANENT live show:', permanentShow.show_name, 'by', presenter.username);
      
      return {
        name: presenter.username,
        description: permanentShow.description || '',
        showName: permanentShow.show_name || `Live with ${presenter.username}`,
        photoUrl,
        isAutoDJ: false,
        endTime: permanentShow.end_time,
      };
    }
    
    console.log('[PresenterService] No live show found, returning auto-DJ');
    return AUTO_DJ;
    
  } catch (error) {
    console.error('[PresenterService] Error fetching live presenter:', error);
    return AUTO_DJ;
  }
};
