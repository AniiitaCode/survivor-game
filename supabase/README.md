# Supabase migrations

Apply the SQL files in order through the Supabase SQL Editor or CLI:

1. 001_create_profiles.sql
2. 002_create_game_sessions.sql
3. 003_create_leaderboards.sql
4. 004_create_user_statistics.sql

This schema uses Supabase Auth users via auth.users and keeps the public profile data in the profiles table.
