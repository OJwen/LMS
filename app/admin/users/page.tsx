import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabaseAdmin'
import AdminUserTableClient from './AdminUserTableClient'

export default async function AdminUsersPage() {
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

    const supabaseAdmin = createAdminClient()

    // 1. Fetch Auth Users (Emails)
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
    const authUsers = authData?.users || []

    // 2. Fetch Profiles + Enrolments
    // Join enrolments into courses to get course data mapping within a single profile row
    const { data: profilesData } = await supabaseAdmin
        .from('profiles')
        .select(`
      id, full_name, avatar_url, role, department, created_at, is_active,
      enrolments(
        course_id, completed_at,
        courses(title)
      )
    `)
        .order('created_at', { ascending: false })

    const profiles = profilesData || []

    // 3. Flatten and Join
    const mergedUsers = profiles.map(prof => {
        const authRecord = authUsers.find(u => u.id === prof.id)
        return {
            id: prof.id,
            full_name: prof.full_name || 'Incomplete Profile',
            email: authRecord?.email || 'invite pending',
            avatar_url: prof.avatar_url,
            role: prof.role,
            department: prof.department || 'Unassigned',
            created_at: prof.created_at,
            is_active: prof.is_active !== false, // backwards compatibility if null handling
            enrolmentCount: prof.enrolments?.length || 0,
            enrolments: prof.enrolments?.map((e: any) => ({
                course_id: e.course_id,
                course_title: Array.isArray(e.courses) ? e.courses[0]?.title : (e.courses?.title || 'Unknown Course'),
                completed_at: e.completed_at
            })) || []
        }
    })

    // 4. Fetch All Courses for Enrolment Slide-over Tool dropdown
    const { data: allCoursesData } = await supabaseAdmin
        .from('courses')
        .select('id, title')
        .order('title', { ascending: true })

    const allCourses = allCoursesData || []

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <header className="mb-10 border-b border-border pb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold font-heading text-primary">User Management</h1>
                        <p className="text-foreground/70 mt-2">Manage all learners and administrators across Aligned Academy.</p>
                    </div>
                </header>

                <AdminUserTableClient users={mergedUsers} allCourses={allCourses} />
            </main>
        </div>
    )
}
