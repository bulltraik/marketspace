<?php

/**
 * Environment configuration for MarketSpace.
 * 
 * In production, these should come from actual environment variables.
 * For local development, this file provides the defaults.
 */

return [
    'SUPABASE_URL'         => getenv('SUPABASE_URL') ?: 'https://ddttbqomoeotjmdujneq.supabase.co',
    'SUPABASE_ANON_KEY'    => getenv('SUPABASE_ANON_KEY') ?: 'sb_publishable_fYREEc0dinLl232_9nouzg_zbi9PQZF',
    // TODO: Add your Supabase Service Role Key here (keep it secret — never expose to client)
    'SUPABASE_SERVICE_KEY' => getenv('SUPABASE_SERVICE_KEY') ?: '',
];
