import { getSupabaseClient } from '../lib/supabase.js';

export const saveGameSession = async ({
    score,
    level,
    enemiesKilled,
    durationSeconds
}) => {

    const supabase = getSupabaseClient();

    const {
        data: userData,
        error: userError
    } = await supabase.auth.getUser();


    if (userError || !userData?.user) {
        return false;
    }

    const { error } = await supabase
        .from('game_sessions')
        .insert({
            user_id: userData.user.id,
            score,
            level_reached: level,
            enemies_killed: enemiesKilled,
            duration_seconds: durationSeconds
        });

    if (error) {
        console.error(error.message);
        return false;
    }

    return true;
};