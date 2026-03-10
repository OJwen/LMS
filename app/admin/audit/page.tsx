import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Audit Logs | Aligned Academy' }

export default async function AuditLogsPage() {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') redirect('/dashboard')

    // Fetch Logs parsing UUID mappings
    const { data: logs } = await supabase
        .from('audit_logs')
        .select(`
      id, action, metadata, created_at,
      profiles!actor_id(full_name, email)
    `)
        .order('created_at', { ascending: false })
        .limit(100)

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <header className="mb-10 border-b border-border pb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold font-heading text-primary">System Audit Log</h1>
                        <p className="text-foreground/70 mt-2">Immutable trailing record of all organizational mutations.</p>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono text-sm">
                            <thead>
                                <tr className="bg-primary/5 border-b border-border">
                                    <th className="px-6 py-4 font-semibold text-primary uppercase text-xs tracking-wider">Timestamp</th>
                                    <th className="px-6 py-4 font-semibold text-primary uppercase text-xs tracking-wider">Actor</th>
                                    <th className="px-6 py-4 font-semibold text-primary uppercase text-xs tracking-wider">Action</th>
                                    <th className="px-6 py-4 font-semibold text-primary uppercase text-xs tracking-wider">Target ID (Meta)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {logs?.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-background/50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-foreground/70">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.profiles ? (
                                                <span className="font-bold text-primary">{log.profiles.full_name}</span>
                                            ) : (
                                                <span className="text-red-400 italic">System / Deleted User</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-accent/10 text-accent font-bold px-2 py-1 rounded inline-block">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-foreground/50 break-all max-w-sm">
                                            {JSON.stringify(log.metadata || {})}
                                        </td>
                                    </tr>
                                ))}
                                {(!logs || logs.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="py-12 text-center text-foreground/50 font-sans">
                                            No logs executed cleanly yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
