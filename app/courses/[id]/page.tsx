import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, Clock, BookOpen, PlayCircle, FileText, CheckCircle, HelpCircle, ArrowLeft, ChevronLeft } from 'lucide-react'
import { enrolInCourse } from '../actions'

function getLessonIcon(type: string, completed: boolean) {
    const color = completed ? 'text-success' : 'text-text-muted'

    if (completed) return <CheckCircle className={`w-5 h-5 ${color}`} />

    switch (type) {
        case 'video': return <PlayCircle className={`w-5 h-5 ${color}`} />
        case 'quiz': return <HelpCircle className={`w-5 h-5 ${color}`} />
        case 'file': return <BookOpen className={`w-5 h-5 ${color}`} />
        case 'text':
        default: return <FileText className={`w-5 h-5 ${color}`} />
    }
}

export default async function CourseDetail({ params }: { params: { id: string } }) {
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

    // Fetch Course + Modules + Lessons
    let query = supabase
        .from('courses')
        .select(`
      *,
      modules(
        id, title, position,
        lessons(id, title, content_type, duration_minutes, position)
      )
    `)
        .eq('id', params.id)

    if (!isAdmin) {
        query = query.eq('is_published', true)
    }

    const { data: course } = await query.single()

    if (!course) {
        redirect('/courses')
    }

    // Fetch Enrolment Status
    const { data: enrolment } = await supabase
        .from('enrolments')
        .select('id, completed_at')
        .eq('user_id', user.id)
        .eq('course_id', params.id)
        .single()

    const isEnrolled = !!enrolment

    // Fetch Progress if Enrolled
    let completedLessonIds = new Set<string>()
    if (isEnrolled) {
        const { data: progress } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true)

        completedLessonIds = new Set(progress?.map(p => p.lesson_id) || [])
    }

    // Formatting Modules and Lessons
    const modules = [...(course.modules || [])].sort((a, b) => a.position - b.position)

    let totalDurationMinutes = 0
    let totalLessons = 0
    let completedCount = 0
    let nextLessonId: string | null = null

    modules.forEach(mod => {
        mod.lessons = [...(mod.lessons || [])].sort((a: any, b: any) => a.position - b.position)

        mod.lessons.forEach((lesson: any) => {
            totalDurationMinutes += lesson.duration_minutes || 0
            totalLessons++

            const isCompleted = completedLessonIds.has(lesson.id)
            lesson.isCompleted = isCompleted

            if (isCompleted) {
                completedCount++
            } else if (!nextLessonId) {
                nextLessonId = lesson.id
            }
        })
    })

    // Fallback next lesson if all are completed
    if (isEnrolled && !nextLessonId && totalLessons > 0) {
        const lastModule = modules[modules.length - 1]
        const lastLesson = lastModule.lessons[lastModule.lessons.length - 1]
        nextLessonId = lastLesson?.id
    }

    const hours = Math.floor(totalDurationMinutes / 60)
    const minutes = totalDurationMinutes % 60
    const durationStr = hours > 0
        ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
        : `${minutes} mins`

    const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

    return (
        <div className="min-h-screen bg-background text-text-secondary font-sans">

            {/* Top Banner if Enrolled */}
            {isEnrolled && (
                <div className="bg-surface border-b border-border shadow-sm sticky top-0 z-20">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-center text-sm font-semibold mb-2">
                                <span className="text-text-primary">Your Progress</span>
                                <span className="text-primary">{progressPercent}% ({completedCount}/{totalLessons})</span>
                            </div>
                            <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {nextLessonId && (
                            <Link
                                href={`/courses/${course.id}/${nextLessonId}`}
                                className="w-full md:w-auto px-6 py-2.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-hover transition-colors duration-200 text-center whitespace-nowrap"
                            >
                                {progressPercent === 100 ? 'Review Course' : 'Continue Learning'}
                            </Link>
                        )}
                    </div>
                </div>
            )}

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">

                <div className="mb-6">
                    <Link
                        href="/courses"
                        className="text-sm text-[#2D5BE3] hover:underline flex items-center gap-1 font-medium"
                    >
                        <ChevronLeft size={16} />
                        Back to Courses
                    </Link>
                </div>

                {/* Breadcrumbs */}
                <nav className="flex items-center text-sm text-text-muted mb-8 overflow-x-auto whitespace-nowrap">
                    <Link href="/dashboard" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="w-4 h-4 mx-2 text-border flex-shrink-0" />
                    <Link href="/courses" className="hover:text-primary transition-colors">Courses</Link>
                    <ChevronRight className="w-4 h-4 mx-2 text-border flex-shrink-0" />
                    <span className="text-text-primary font-medium truncate">{course.title}</span>
                </nav>

                {/* Hero Section */}
                <header className="mb-12">
                    {isAdmin && !course.is_published && (
                        <div className="inline-block bg-surface-alt text-text-secondary text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-border mb-4">
                            Draft (Unpublished)
                        </div>
                    )}

                    <div className="aspect-video w-full bg-primary-light rounded-2xl overflow-hidden shadow-sm mb-8 relative border border-border">
                        {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-primary/20">
                                <BookOpen className="w-20 h-20 mb-4" />
                                <span className="font-heading text-xl">Aligned Academy</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3 mb-4">
                        {course.category && (
                            <span className="bg-primary-light text-primary border border-primary-light px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
                                {course.category}
                            </span>
                        )}
                        <span className="bg-surface border border-border text-text-secondary px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {totalDurationMinutes > 0 ? durationStr : 'Self-paced'}
                        </span>
                        <span className="bg-surface border border-border text-text-secondary px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            {totalLessons} Lessons
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-normal font-display text-text-primary mb-6 leading-tight">
                        {course.title}
                    </h1>

                    <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-3xl">
                        {course.description}
                    </p>

                    {!isEnrolled && (
                        <form action={enrolInCourse}>
                            <input type="hidden" name="courseId" value={course.id} />
                            <button
                                type="submit"
                                className="px-8 py-4 bg-primary text-white font-bold text-lg rounded-full shadow-md hover:bg-primary-hover transition-colors duration-200 hover:-translate-y-0.5"
                            >
                                Enrol Now for Free
                            </button>
                        </form>
                    )}
                </header>

                {/* Curriculum Section */}
                <section>
                    <h2 className="text-2xl font-normal font-display text-text-primary mb-8 border-b border-border pb-4">Curriculum</h2>

                    {modules.length > 0 ? (
                        <div className="space-y-6">
                            {modules.map((module: any, idx) => (
                                <div key={module.id} className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
                                    <div className="px-6 py-5 bg-surface-alt border-b border-border flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">Module {idx + 1}</p>
                                            <h3 className="text-xl font-normal font-display text-text-primary">{module.title}</h3>
                                        </div>
                                        <span className="text-sm font-medium text-text-muted bg-surface px-3 py-1 rounded-full border border-border">
                                            {module.lessons.length} {module.lessons.length === 1 ? 'Lesson' : 'Lessons'}
                                        </span>
                                    </div>

                                    <div className="divide-y divide-border">
                                        {module.lessons.map((lesson: any, lessonIdx: number) => {
                                            const isLink = isEnrolled && !!lesson.id;
                                            const Wrapper = isLink ? Link : 'div'
                                            const wrapperProps = isLink ? { href: `/courses/${course.id}/${lesson.id}` } : {}

                                            return (
                                                <Wrapper
                                                    key={lesson.id}
                                                    {...wrapperProps as any}
                                                    className={`flex items-center p-4 sm:px-6 hover:bg-surface-alt transition group ${isEnrolled ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
                                                >
                                                    <div className="mr-4 flex-shrink-0">
                                                        {getLessonIcon(lesson.content_type, lesson.isCompleted)}
                                                    </div>

                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <p className="text-sm font-medium text-text-muted mb-0.5">Lesson {lessonIdx + 1}</p>
                                                        <p className={`text-base font-semibold truncate ${lesson.isCompleted ? 'text-text-muted' : 'text-text-primary group-hover:text-primary transition-colors'}`}>
                                                            {lesson.title}
                                                        </p>
                                                    </div>

                                                    <div className="flex-shrink-0 text-sm font-medium text-text-muted flex items-center gap-1.5">
                                                        {lesson.duration_minutes ? (
                                                            <>
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {lesson.duration_minutes}m
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </Wrapper>
                                            )
                                        })}

                                        {module.lessons.length === 0 && (
                                            <div className="p-6 text-center text-foreground/50 text-sm">
                                                Lessons are currently being prepared for this module.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-white border border-border rounded-xl shadow-sm">
                            <BookOpen className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold font-heading text-primary mb-2">Curriculum in Progress</h3>
                            <p className="text-foreground/70">The content for this course is still being developed by the Aligned team.</p>
                        </div>
                    )}
                </section>

            </main>
        </div>
    )
}
