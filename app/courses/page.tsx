import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, Clock, Search, ArrowLeft } from 'lucide-react'
import CourseFilters from '@/components/courses/CourseFilters'

export default async function CourseCatalogue({
    searchParams,
}: {
    searchParams: { q?: string; category?: string }
}) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value }
            }
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'
    const searchQuery = searchParams?.q || ''
    const categoryFilter = searchParams?.category || ''

    // Fetch enrolments to determine 'Enrol' vs 'Continue'
    const { data: enrolments } = await supabase
        .from('enrolments')
        .select('course_id')
        .eq('user_id', user.id)

    const enrolledIds = new Set(enrolments?.map(e => e.course_id) || [])

    // Start query for courses
    let query = supabase
        .from('courses')
        .select(`
      id, title, description, thumbnail_url, category, is_published,
      modules(lessons(duration_minutes))
    `)

    // Apply Role Filter
    if (!isAdmin) {
        query = query.eq('is_published', true)
    }

    // Apply Search Filter server-side if using text search
    if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`)
    }

    // Apply Category Filter server-side
    if (categoryFilter) {
        query = query.eq('category', categoryFilter)
    }

    const { data: coursesData } = await query

    // Calculate durations and process courses
    const courses = (coursesData || []).map(course => {
        let totalMinutes = 0
        if (course.modules) {
            course.modules.forEach((mod: any) => {
                if (mod.lessons) {
                    mod.lessons.forEach((lesson: any) => {
                        totalMinutes += lesson.duration_minutes || 0
                    })
                }
            })
        }

        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        const durationStr = hours > 0
            ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
            : `${minutes} mins`

        return {
            ...course,
            totalMinutes,
            durationStr: totalMinutes > 0 ? durationStr : 'Self-paced',
            isEnrolled: enrolledIds.has(course.id)
        }
    })

    // Get unique categories for the filter dropdown
    const { data: uniqueCategoriesData } = await supabase
        .from('courses')
        .select('category')
        .not('category', 'is', null)

    const allCategories = Array.from(new Set((uniqueCategoriesData || []).map(c => c.category))).filter(Boolean) as string[]

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

                <header className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-normal font-display text-text-primary mb-4">Course Catalogue</h1>
                    <p className="text-lg text-text-secondary max-w-2xl">
                        Explore our curated selection of courses and materials tailored to supercharge your business consulting expertise with Aligned Academy.
                    </p>
                </header>

                <CourseFilters
                    searchQuery={searchQuery}
                    categoryFilter={categoryFilter}
                    allCategories={allCategories}
                />

                {/* Courses Grid */}
                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map(course => (
                            <div key={course.id} className="bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col group relative">
                                {/* Draft Badge for Admins */}
                                {isAdmin && !course.is_published && (
                                    <div className="absolute top-4 right-4 z-10 bg-surface-alt text-text-secondary text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-border">
                                        Draft
                                    </div>
                                )}

                                <Link href={`/courses/${course.id}`} className="block aspect-video w-full bg-primary-light relative overflow-hidden group">
                                    {course.thumbnail_url ? (
                                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-primary/20 group-hover:scale-105 transition duration-500">
                                            <BookOpen className="w-14 h-14" />
                                        </div>
                                    )}
                                    {course.category && (
                                        <span className="absolute top-4 left-4 text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full font-medium shadow-sm">
                                            {course.category}
                                        </span>
                                    )}
                                </Link>

                                <div className="p-5 flex-1 flex flex-col">
                                    <Link href={`/courses/${course.id}`}>
                                        <h3 className="font-display text-text-primary text-lg font-normal mb-3 line-clamp-2">{course.title}</h3>
                                    </Link>
                                    <p className="text-sm text-text-muted mb-6 line-clamp-3 leading-relaxed flex-1">{course.description}</p>

                                    <div className="flex items-center justify-between text-sm text-text-muted mb-6 border-t border-border pt-4">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            <span>{course.durationStr}</span>
                                        </div>
                                    </div>

                                    {course.isEnrolled ? (
                                        <Link
                                            href={`/courses/${course.id}`}
                                            className="block w-full text-center border border-primary text-primary bg-transparent font-semibold rounded-full px-6 py-2.5 hover:bg-primary-light transition-colors duration-200"
                                        >
                                            Continue
                                        </Link>
                                    ) : (
                                        <Link
                                            href={`/courses/${course.id}`}
                                            className="block w-full text-center bg-[#2D5BE3] text-white font-semibold rounded-full px-6 py-2.5 hover:bg-[#1E45C7] transition-colors duration-200"
                                        >
                                            View & Enrol
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-surface border border-border rounded-2xl">
                        <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <h3 className="font-display text-text-primary text-xl font-normal mb-2">No courses found</h3>
                        <p className="text-text-secondary mb-6">Try adjusting your search criteria or filters.</p>
                        <Link href="/courses" className="text-primary font-semibold hover:text-primary-hover underline transition-colors">
                            Clear filters
                        </Link>
                    </div>
                )}
            </main>
        </div>
    )
}
