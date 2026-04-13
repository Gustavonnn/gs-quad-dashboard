import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Ambiente GS-QUAD Config
const SUPABASE_URL = 'https://mxwzvdbzwnavsnvndted.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_LVv655unDsN4UwPt1eEIAg_dTOUs_VV'

// Construtor do Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
