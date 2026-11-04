const { createClient } = require('@supabase/supabase-js');

const getSupabaseClient = () => {
  const { SUPABASE_URL, SUPABASE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY must be configured');
  }

  return createClient(SUPABASE_URL, SUPABASE_KEY);
};

module.exports = getSupabaseClient;