<?php

/**
 * Environment configuration for MarketSpace.
 * 
 * In production, these should come from actual environment variables.
 * For local development, this file provides the defaults.
 */

return [
    'SUPABASE_URL'         => getenv('SUPABASE_URL') ?: 'https://ddttbqomoeotjmdujneq.supabase.co',
    'SUPABASE_ANON_KEY'    => getenv('SUPABASE_ANON_KEY') ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdHRicW9tb2VvdGptZHVqbmVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjIxMjEsImV4cCI6MjA5MzAzODEyMX0.Ta5FPuhKEvHSEbSGFt0krJeIXHzdrNCmtakmy2jvaw0',
    'SUPABASE_SERVICE_KEY' => getenv('SUPABASE_SERVICE_KEY') ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdHRicW9tb2VvdGptZHVqbmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ2MjEyMSwiZXhwIjoyMDkzMDM4MTIxfQ.7Kd8YuNW3EqRxqcW8HGQp5tSFNFjgwBIzvPBZa_3Ojo',
];
