import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tcxtwxwujgsymhvuzvqc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjeHR3eHd1amdzeW1odnV6dnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTI3MTksImV4cCI6MjA5MzU4ODcxOX0.P4xJeDlZtzvbnQtUngmq5YJ1s6zEQl83cOwzh98OX60'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  }
})