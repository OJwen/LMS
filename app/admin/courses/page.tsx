import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import AdminCourseTableClient from './AdminCourseTableClient'

export default async function AdminCoursesPage() {
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

    // Fetch all courses including enrolments count
    const { data: courses } = await supabase
        .from('courses')
        .select(`
      id, title, category, is_published, created_at,
      enrolments(count)
    `)
        .order('created_at', { ascending: false })

    // Mapping to flatten the enrolments count
    const mappedCourses = (courses || []).map(c => ({
        id: c.id,
        title: c.title,
        category: c.category || 'Uncategorized',
        is_published: c.is_published,
        created_at: c.created_at,
        enrolmentCount: c.enrolments?.[0]?.count || 0
    }))

    return (
        <div className="min-h-screen bg-background text-text-secondary font-sans">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="text-sm text-[#2D5BE3] hover:underline flex items-center gap-1 font-medium transition-all"
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>
                </div>

                <header className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4 border-b border-border pb-6">
                    <div>
                        <h1 className="text-4xl font-normal font-display text-text-primary">Course Management</h1>
                        <p className="text-text-muted mt-2">Create, edit, and organize all Aligned Academy resources.</p>
                    </div>
                    <Link
                        href="/admin/courses/new"
                        className="px-6 py-3 bg-primary text-white font-semibold rounded-full shadow-md hover:bg-primary-hover transition-colors duration-200"
                    >
                        Create New Course
                    </Link>
                </header>

                <AdminCourseTableClient courses={mappedCourses} />
            </main>
        </div>
    )
}
