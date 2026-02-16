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
 */
const isShowLive = (show: ScheduleItem, now: Date): boolean => {
  const startTime = new Date(show.start_time);
  const endTime = new Date(show.end_time);
  
  if (show.permanent) {
    // For permanent/recurring shows, match by day of week and time only
    // getUTCDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const nowDay = now.getUTCDay();
    const showDay = startTime.getUTCDay();
    
    const nowHours = now.getUTCHours();
    const nowMinutes = now.getUTCMinutes();
    const nowTotalMinutes = nowHours * 60 + nowMinutes;
    
    const startHours = startTime.getUTCHours();
    const startMinutes = startTime.getUTCMinutes();
    const startTotalMinutes = startHours * 60 + startMinutes;
    
    const endHours = endTime.getUTCHours();
    const endMinutes = endTime.getUTCMinutes();
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    const isSameDay = nowDay === showDay;
    const isWithinTime = nowTotalMinutes >= startTotalMinutes && nowTotalMinutes < endTotalMinutes;
    
    // Debug logging
    console.log(`[isShowLive] ${show.show_name}: nowDay=${nowDay}, showDay=${showDay}, ` +
      `nowTime=${nowHours}:${nowMinutes} (${nowTotalMinutes}min), ` +
      `showTime=${startHours}:${startMinutes}-${endHours}:${endMinutes} (${startTotalMinutes}-${endTotalMinutes}min), ` +
      `sameDay=${isSameDay}, withinTime=${isWithinTime}`);
    
    return isSameDay && isWithinTime;
  } else {
    // For one-time shows, check if current timestamp is within the exact range
    const isLive = now >= startTime && now < endTime;
    
    console.log(`[isShowLive] ${show.show_name} (one-time): ` +
      `now=${now.toISOString()}, start=${startTime.toISOString()}, end=${endTime.toISOString()}, ` +
      `isLive=${isLive}`);
    
    return isLive;
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
    
    console.log(`[PresenterService] Current UTC: ${now.toISOString()}, Day: ${now.getUTCDay()}, Hour: ${now.getUTCHours()}`);
    console.log(`[PresenterService] Checking ${scheduleData.length} shows for live presenter`);
    
    // Find the currently live show - check permanent shows first as they're recurring
    // Sort to prioritize permanent shows that match the current time slot
    const sortedShows = [...scheduleData].sort((a, b) => {
      // Prioritize permanent shows
      if (a.permanent && !b.permanent) return -1;
      if (!a.permanent && b.permanent) return 1;
      return 0;
    });
    
    const liveShow = sortedShows.find(show => {
      // Skip shows without a presenter
      if (!show.users_permissions_user) return false;
      return isShowLive(show, now);
    });
    
    if (liveShow && liveShow.users_permissions_user) {
      const presenter = liveShow.users_permissions_user;
      const photoUrl = presenter.profile_photo?.url 
        ? `https://trucksim.fm${presenter.profile_photo.url}`
        : null;
      
      console.log('[PresenterService] Found live presenter:', presenter.username, 'Show:', liveShow.show_name);
      
      return {
        name: presenter.username,
        description: liveShow.description || '',
        showName: liveShow.show_name,
        photoUrl,
        isAutoDJ: false,
        endTime: liveShow.end_time,
      };
    }
    
    console.log('[PresenterService] No live show found, returning auto-DJ');
    return AUTO_DJ;
    
  } catch (error) {
    console.error('[PresenterService] Error fetching live presenter:', error);
    return AUTO_DJ;
  }
};
