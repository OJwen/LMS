import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import CourseForm from './CourseForm'
import CurriculumBuilder from './CurriculumBuilder'

export default async function AdminEditCoursePage({
    params
}: {
    params: { id: string }
}) {
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

    // Fetch Course + Modules + Lessons strictly sorted 
    const { data: course, error } = await supabase
        .from('courses')
        .select(`
      *,
      modules(
        id, title, position,
        lessons(*)
      )
    `)
        .eq('id', params.id)
        .single()

    if (error || !course) redirect('/admin/courses')

    // Enforce rigid position sorting for arrays from Supabase
    const modules = [...(course.modules || [])].sort((a, b) => a.position - b.position)
    modules.forEach(mod => {
        mod.lessons = [...(mod.lessons || [])].sort((a: any, b: any) => a.position - b.position)
    })

    return (
        <div className="min-h-screen bg-background text-text-secondary font-sans transition-colors duration-500">
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <header className="mb-12">
                    <Link href="/admin/courses" className="inline-flex items-center text-sm font-bold text-text-muted hover:text-primary transition-all mb-6 group">
                        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Course Management
                    </Link>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-border pb-8">
                        <div>
                            <h1 className="text-5xl font-normal font-display text-text-primary flex items-center gap-4">
                                Edit Course
                                {!course.is_published && (
                                    <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-widest mt-1">Draft</span>
                                )}
                            </h1>
                            <p className="text-text-muted mt-2 text-lg">Refine course details and manage your curriculum structure.</p>
                        </div>
                    </div>
                </header>

                <div className="space-y-16">
                    {/* Section 1: Top Level Info */}
                    <section>
                        <h2 className="text-3xl font-normal font-display text-text-primary mb-8 ml-1">Basic Information</h2>
                        <CourseForm course={course} />
                    </section>

                    {/* Section 2: Structure & Drag Drop */}
                    <section className="bg-surface p-10 rounded-3xl shadow-sm border border-border">
                        <CurriculumBuilder courseId={course.id} initialModules={modules} />
                    </section>
                </div>

            </main>
        </div>
    )
}
