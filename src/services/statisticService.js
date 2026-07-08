import { getSupabaseClient } from '../lib/supabase.js';

export const updateStatistics = async () => {
    const supabase = getSupabaseClient();

    try {
        const {
            data: userData,
            error: userError
        } = await supabase.auth.getUser();


        if (userError || !userData?.user) {
            return false;
        }


        const userId = userData.user.id;


        const {
            data: sessions,
            error: sessionsError
        } = await supabase
            .from('game_sessions')
            .select(`
                score,
                level_reached,
                enemies_killed
            `)
            .eq('user_id', userId);


        if (sessionsError) {
            console.error(
                'Loading sessions error:',
                sessionsError.message
            );

            return false;
        }


        if (!sessions || sessions.length === 0) {

            await supabase
                .from('user_statistics')
                .upsert({
                    user_id: userId,
                    games_played: 0,
                    total_score: 0,
                    best_score: 0,
                    highest_level: 1,
                    total_enemies_killed: 0,
                    updated_at: new Date()
                });

            return true;
        }


        const statistics = {
            user_id: userId,

            games_played: sessions.length,

            total_score: sessions.reduce(
                (sum, game) => sum + game.score,
                0
            ),

            best_score: Math.max(
                ...sessions.map(game => game.score)
            ),

            highest_level: Math.max(
                ...sessions.map(game => game.level_reached)
            ),

            total_enemies_killed: sessions.reduce(
                (sum, game) => sum + game.enemies_killed,
                0
            ),

            updated_at: new Date()
        };


        const {
            error: updateError
        } = await supabase
            .from('user_statistics')
            .upsert(statistics, {
                onConflict: 'user_id'
            });


        if (updateError) {
            console.error(
                'Statistics update error:',
                updateError.message
            );

            return false;
        }


        return true;


    } catch (error) {

        console.error(
            'Statistics service error:',
            error
        );

        return false;
    }
};