import { getSupabaseClient } from '../lib/supabase.js';

export const saveLeaderboardScore = async ({ score, level, mode }) => {
  const supabase = getSupabaseClient();

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error('No user logged in');
      return false;
    }

    const { error } = await supabase
      .from('leaderboards')
      .insert([
        {
          user_id: userData.user.id,
          score,
          level,
          mode
        }
      ]);

    if (error) {
      console.error('Supabase insert error:', error.message);
      return false;
    }

    return true;

  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
};
