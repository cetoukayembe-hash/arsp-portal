import { supabase } from './supabase';

export async function logAudit(action: string, targetTable?: string, targetId?: string, details?: any) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from('audit_logs').insert({
      user_id: session.user.id,
      user_email: session.user.email,
      action,
      target_table: targetTable || null,
      target_id: targetId || null,
      details: details || null,
      ip_address: null,
      user_agent: navigator.userAgent,
      success: true,
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}