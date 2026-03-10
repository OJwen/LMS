import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
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
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    // Data Fetching: Enrolments & Courses
    const { data: enrolments } = await supabase
        .from('enrolments')
        .select(`
      course_id, 
      enrolled_at, 
      completed_at, 
      courses(id, title, thumbnail_url)
    `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false })

    const enrolledCourseIds = enrolments?.map(e => e.course_id) || []

    // Progress Array Mapping
    let coursesWithProgress: any[] = []

    if (enrolledCourseIds.length > 0) {
        const { data: coursesData } = await supabase
            .from('courses')
            .select('id, modules(lessons(id))')
            .in('id', enrolledCourseIds)

        const { data: progressData } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true)

        const completedLessonIds = new Set(progressData?.map(p => p.lesson_id) || [])

        coursesWithProgress = (enrolments || []).map(enrolment => {
            const course = Array.isArray(enrolment.courses) ? enrolment.courses[0] : enrolment.courses
            const courseStructure = coursesData?.find(c => c.id === course?.id)

            let totalLessons = 0
            let completedCount = 0

            if (courseStructure?.modules) {
                courseStructure.modules.forEach((m: any) => {
                    if (m.lessons) {
                        m.lessons.forEach((l: any) => {
                            totalLessons++
                            if (completedLessonIds.has(l.id)) completedCount++
                        })
                    }
                })
            }

            const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100)

            return {
                id: course.id,
                title: course.title,
                thumbnail_url: course.thumbnail_url,
                progressPercent,
                completedCount,
                totalLessons,
                enrolled_at: enrolment.enrolled_at,
                completed_at: enrolment.completed_at
            }
        })
    }

    // Achievement Analytics Data
    const hasCompletedCourse = coursesWithProgress.some(c => !!c.completed_at)

    const { count: completedLessonsCount } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true)

    const has5Lessons = (completedLessonsCount || 0) >= 5

    const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('score')
        .eq('user_id', user.id)
        .eq('score', 100)
        .limit(1)

    const isQuizAce = (quizAttempts || []).length > 0

    const achievements = {
        firstCourse: hasCompletedCourse,
        fiveLessons: has5Lessons,
        quizAce: isQuizAce
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="text-sm text-[#2D5BE3] hover:underline flex items-center gap-1 font-medium transition-all"
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>
                </div>
                <header className="mb-10 text-center md:text-left border-b border-border pb-6">
                    <h1 className="text-4xl font-bold font-heading text-primary">Your Profile</h1>
                    <p className="text-foreground/70 mt-2">Manage your account details and view your progress.</p>
                </header>

                <ProfileClient
                    user={user}
                    profile={profile}
                    courses={coursesWithProgress}
                    achievements={achievements}
                />
            </main>
        </div>
    )
}
