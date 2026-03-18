import { supabase } from './supabase';

export interface AuditLog {
  action: string;
  targetTable: string;
  targetId?: string;
  changes?: Record<string, any>;
  status?: 'success' | 'failed' | 'pending';
  errorMessage?: string;
}

/**
 * Log an admin action to the audit trail
 * Should be called after any admin operation (plan change, credits, delete, etc.)
 */
export async function logAdminAction(log: AuditLog) {
  try {
    const { data: adminProfile } = await supabase
      .from('viralize_users')
      .select('id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!adminProfile) {
      if (import.meta.env.DEV) console.error('Admin profile not found for audit log');
      return;
    }

    // Get request metadata
    const ipAddress = await getClientIP();
    const userAgent = navigator.userAgent;

    const { error } = await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: adminProfile.id,
        action: log.action,
        target_table: log.targetTable,
        target_id: log.targetId || null,
        changes: log.changes || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: log.status || 'success',
        error_message: log.errorMessage || null,
      });

    if (error) {
      if (import.meta.env.DEV) console.error('Audit log error:', error);
    }
  } catch (err) {
    if (import.meta.env.DEV) console.error('Audit logging failed:', err);
  }
}

/**
 * Get client IP address (best effort)
 */
async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      mode: 'no-cors',
      signal: AbortSignal.timeout(2000)
    });
    const data = await response.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

/**
 * Fetch audit logs for admin panel
 */
export async function fetchAuditLogs(limit = 50, offset = 0) {
  const { data, error } = await supabase
    .from('admin_audit_logs_detailed')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    if (import.meta.env.DEV) console.error('Fetch audit logs error:', error);
    return [];
  }

  return data || [];
}

/**
 * Create an admin impersonation session
 * Returns a temporary session token that simulates the customer's auth
 */
export async function createImpersonationSession(customerId: string, reason: string) {
  try {
    const { data: adminProfile } = await supabase
      .from('viralize_users')
      .select('id, is_admin')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!adminProfile?.is_admin) {
      throw new Error('Only admins can create impersonation sessions');
    }

    // Generate secure token
    const sessionToken = `${customerId}_${crypto.getRandomValues(new Uint8Array(16)).toString()}_${Date.now()}`;
    const ipAddress = await getClientIP();
    const userAgent = navigator.userAgent;

    const { data, error } = await supabase
      .from('admin_impersonation_sessions')
      .insert({
        admin_id: adminProfile.id,
        customer_id: customerId,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        reason,
        expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 min
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Log this action
    await logAdminAction({
      action: 'CREATE_IMPERSONATION_SESSION',
      targetTable: 'admin_impersonation_sessions',
      targetId: data.id,
      changes: { reason },
    });

    return { sessionToken, expiresAt: data.expires_at };
  } catch (err) {
    if (import.meta.env.DEV) console.error('Impersonation session error:', err);
    throw err;
  }
}

/**
 * End an admin impersonation session
 */
export async function endImpersonationSession(sessionId: string) {
  try {
    const { error } = await supabase
      .from('admin_impersonation_sessions')
      .update({
        is_active: false,
        ended_at: new Date(),
      })
      .eq('id', sessionId);

    if (error) {
      throw new Error(error.message);
    }

    await logAdminAction({
      action: 'END_IMPERSONATION_SESSION',
      targetTable: 'admin_impersonation_sessions',
      targetId: sessionId,
    });
  } catch (err) {
    if (import.meta.env.DEV) console.error('End impersonation error:', err);
    throw err;
  }
}
