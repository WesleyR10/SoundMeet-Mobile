export type TopRequestedSong = {
  song_title: string;
  artist?: string;
  count: number;
};

export type MusicianAnalytics = {
  musician_id: string;
  average_rating: number;
  total_ratings: number;
  plan_tier: string;
  realtime_available: boolean;
  accepted_requests_count: number;
  rejected_requests_count: number;
  total_tips_amount: number;
  top_requested_songs: TopRequestedSong[];
};
