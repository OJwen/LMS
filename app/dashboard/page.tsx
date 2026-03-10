import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, CheckCircle, GraduationCap } from 'lucide-react'

// Helper component for Stat Cards
function StatCard({ title, value, icon: Icon }: { title: string, value: number | string, icon: any }) {
    return (
        <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm flex items-center space-x-5">
            <div className="p-4 bg-primary-light rounded-full text-primary shadow-inner">
                <Icon className="w-7 h-7" />
            </div>
            <div>
                <p className="text-sm text-text-secondary font-medium uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-bold font-sans text-text-primary mt-1">{value}</p>
            </div>
        </div>
    )
}

export default async function Dashboard() {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    // Auth & Profile Fetching
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    const firstName = profile?.full_name?.split(' ')[0] || 'Learner'
    const today = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date())

    // Data Fetching: Enrolments
    const { data: enrolments } = await supabase
        .from('enrolments')
        .select(`
      course_id, 
      completed_at, 
      courses!inner(id, title, description, thumbnail_url, category)
    `)
        .eq('user_id', user.id)

    const enrolledCourseIds = enrolments?.map(e => e.course_id) || []

    // Calculate Progress for Enrolled Courses
    let coursesWithProgress: any[] = []

    if (enrolledCourseIds.length > 0) {
        const { data: coursesData } = await supabase
            .from('courses')
            .select('id, modules(id, position, lessons(id, position))')
            .in('id', enrolledCourseIds)

        const { data: progressData } = await supabase
            .from('lesson_progress')
            .select('lesson_id, completed')
            .eq('user_id', user.id)
            .eq('completed', true)

        const completedLessonIds = new Set(progressData?.map(p => p.lesson_id) || [])

        coursesWithProgress = (enrolments || []).map(enrolment => {
            // Handle Supabase joining returning objects or arrays
            const course = Array.isArray(enrolment.courses) ? enrolment.courses[0] : enrolment.courses
            const courseStructure = coursesData?.find(c => c.id === course?.id)

            let totalLessons = 0
            let completedCount = 0
            let nextLessonId = null

            if (courseStructure?.modules) {
                // Flatten and sort lessons to determine chronological next lesson
                const allLessons = courseStructure.modules.flatMap((m: any) =>
                    (m.lessons || []).map((l: any) => ({ ...l, modulePosition: m.position }))
                ).sort((a: any, b: any) => {
                    if (a.modulePosition === b.modulePosition) return a.position - b.position
                    return a.modulePosition - b.modulePosition
                })

                totalLessons = allLessons.length

                for (const lesson of allLessons) {
                    if (completedLessonIds.has(lesson.id)) {
                        completedCount++
                    } else if (!nextLessonId) {
                        nextLessonId = lesson.id
                    }
                }

                // If all lessons completed but no next lesson is found
                if (!nextLessonId && allLessons.length > 0) {
                    nextLessonId = allLessons[allLessons.length - 1].id
                }
            }

            const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100)

            return {
                ...course,
                progressPercent,
                nextLessonId,
                isCompleted: !!enrolment.completed_at
            }
        })
    }

    // Stats Counters
    const coursesEnrolledCount = enrolledCourseIds.length
    const coursesCompletedCount = enrolments?.filter(e => e.completed_at).length || 0

    const { count: lessonsCompletedCount } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true)

    // Data Fetching: Recommended Courses
    let recommendedQuery = supabase
        .from('courses')
        .select('id, title, description, thumbnail_url, category')
        .eq('is_published', true)

    if (enrolledCourseIds.length > 0) {
        recommendedQuery = recommendedQuery.not('id', 'in', `(${enrolledCourseIds.join(',')})`)
    }

    const { data: recommendedCourses } = await recommendedQuery.limit(6)

    return (
        <div className="min-h-screen bg-background text-text-secondary font-sans">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

                {/* Welcome Section */}
                <header className="border-b border-border pb-8">
                    <h1 className="text-4xl md:text-5xl font-normal font-display text-text-primary">
                        Welcome back, {firstName}
                    </h1>
                    <p className="text-lg text-text-secondary mt-3 font-medium tracking-wide">
                        {today}
                    </p>
                </header>

                {/* Stats Section */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Courses Enrolled" value={coursesEnrolledCount} icon={BookOpen} />
                    <StatCard title="Courses Completed" value={coursesCompletedCount} icon={GraduationCap} />
                    <StatCard title="Lessons Completed" value={lessonsCompletedCount || 0} icon={CheckCircle} />
                </section>

                {/* My Courses Section */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-normal font-display text-text-primary">My Courses</h2>
                        {coursesWithProgress.length > 0 && (
                            <Link href="/courses" className="text-primary font-semibold hover:text-primary-hover transition-colors">
                                View All
                            </Link>
                        )}
                    </div>

                    {coursesWithProgress.length > 0 ? (
                        <div className="flex overflow-x-auto gap-8 pb-6 snap-x snap-mandatory hide-scrollbar">
                            {coursesWithProgress.map(course => (
                                <div key={course.id} className="min-w-[340px] max-w-[340px] bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col snap-start">
                                    <div className="aspect-video w-full bg-primary-light relative">
                                        {course.thumbnail_url ? (
                                            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary/20">
                                                <BookOpen className="w-12 h-12" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-display text-text-primary text-lg font-normal mb-2 line-clamp-1">{course.title}</h3>

                                        <div className="mt-auto pt-6 space-y-5">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm font-semibold">
                                                    <span className="text-text-muted">Progress</span>
                                                    <span className="text-text-primary">{course.progressPercent}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                                                        style={{ width: `${course.progressPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <Link
                                                href={course.nextLessonId ? `/courses/${course.id}/${course.nextLessonId}` : `/courses/${course.id}`}
                                                className="block w-full text-center py-2.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-hover transition-colors duration-200"
                                            >
                                                {course.isCompleted ? 'Review Course' : 'Continue'}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-surface border border-border rounded-2xl shadow-sm">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-light text-primary mb-4">
                                <BookOpen className="w-8 h-8 opacity-50" />
                            </div>
                            <h3 className="text-2xl font-normal font-display text-text-primary mb-2">You aren't enrolled in any courses</h3>
                            <p className="text-text-secondary mb-6 max-w-md mx-auto">Explore our catalogue and pick up a course to start your learning journey with Aligned Academy.</p>
                            <Link href="/courses" className="inline-block px-6 py-2.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-hover transition-colors duration-200">
                                Browse Catalogue
                            </Link>
                        </div>
                    )}
                </section>

                {/* Recommended Courses Section */}
                <section>
                    <h2 className="text-2xl font-normal font-display text-text-primary mb-8">Recommended For You</h2>
                    {recommendedCourses && recommendedCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {recommendedCourses.map(course => (
                                <div key={course.id} className="bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
                                    <div className="aspect-video w-full bg-primary-light relative">
                                        {course.thumbnail_url ? (
                                            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary/20">
                                                <GraduationCap className="w-14 h-14" />
                                            </div>
                                        )}
                                        {course.category && (
                                            <span className="absolute top-4 left-4 text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full font-medium shadow-sm">
                                                {course.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-display text-text-primary text-lg font-normal mb-3 line-clamp-2">{course.title}</h3>
                                        <p className="text-sm text-text-muted mb-8 line-clamp-3 leading-relaxed flex-1">{course.description}</p>
                                        <Link
                                            href={`/courses/${course.id}`}
                                            className="block w-full text-center border border-primary text-primary bg-transparent font-semibold rounded-full px-6 py-2.5 hover:bg-primary-light transition-colors duration-200"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-text-secondary text-lg bg-surface p-6 rounded-2xl border border-border">
                            You are all caught up! There are no new courses available at the moment.
                        </p>
                    )}
                </section>

            </main>
        </div>
    )
}
