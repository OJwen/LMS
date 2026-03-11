import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, FileText, Download, CheckCircle, House } from 'lucide-react'
import CourseSidebar from '../../../../components/courses/CourseSidebar'
import QuizClient from '../../../../components/courses/QuizClient'
import MarkCompleteButton from './MarkCompleteButton'

export default async function LessonPlayer({
    params
}: {
    params: { id: string, lessonId: string }
}) {
    const courseId = params.id
    const lessonId = params.lessonId

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

    // Fetch User Profile to check for Admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    // Enrolment Guard (Admins bypass)
    if (!isAdmin) {
        const { data: enrolment } = await supabase
            .from('enrolments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .single()

        if (!enrolment) {
            redirect(`/courses/${courseId}`)
        }
    }

    // Fetch Course Structure for Sidebar & Navigation
    const { data: courseData } = await supabase
        .from('courses')
        .select(`
      title,
      modules(
        id, title, position,
        lessons(id, title, position, content_type, duration_minutes)
      )
    `)
        .eq('id', courseId)
        .single()

    if (!courseData) redirect('/courses')

    // Fetch Progress mapping
    const { data: progressData } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('completed', true)

    const completedLessonIds = new Set(progressData?.map(p => p.lesson_id) || [])

    // Process Sidebar data + Prev/Next
    const modules = [...(courseData.modules || [])].sort((a, b) => a.position - b.position)
    let flatLessons: any[] = []

    modules.forEach(mod => {
        mod.lessons = [...(mod.lessons || [])].sort((a: any, b: any) => a.position - b.position)
        mod.lessons.forEach((lesson: any) => {
            lesson.isCompleted = completedLessonIds.has(lesson.id)
            lesson.moduleTitle = mod.title
            flatLessons.push(lesson)
        })
    })

    // Find current lesson index for Next/Prev
    const currentIdx = flatLessons.findIndex(l => l.id === lessonId)
    if (currentIdx === -1) redirect(`/courses/${courseId}`) // Fallback if lesson hidden/deleted

    const currentLessonMeta = flatLessons[currentIdx]
    const prevLesson = currentIdx > 0 ? flatLessons[currentIdx - 1] : null
    const nextLesson = currentIdx < flatLessons.length - 1 ? flatLessons[currentIdx + 1] : null

    // Fetch complete current lesson data
    const { data: lesson } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

    if (!lesson) redirect(`/courses/${courseId}`)


    // Fetch Quiz Questions if they exist for this lesson
    const { data: quizQuestions } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('position', { ascending: true })

    // Helper to extract YouTube ID from string
    const getYoutubeEmbed = (url: string) => {
        let videoId = ''
        try {
            const parsedUrl = new URL(url)
            if (parsedUrl.hostname.includes('youtube.com')) {
                videoId = parsedUrl.searchParams.get('v') || ''
            } else if (parsedUrl.hostname.includes('youtu.be')) {
                videoId = parsedUrl.pathname.slice(1)
            }
        } catch (e) { }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?rel=0`
        }
        return null
    }

    return (
        <div className="flex min-h-screen bg-background text-text-secondary font-sans">

            {/* Sidebar Navigation */}
            <CourseSidebar courseId={courseId} modules={modules} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full max-w-[100vw] custom-scrollbar">

                {/* Top Header / Breadcrumbs */}
                <header className="px-8 py-5 border-b border-border bg-white sticky top-0 z-10 flex flex-col gap-3 shadow-sm">
                    <Link
                        href="/dashboard"
                        className="text-xs text-[#94A3B8] hover:text-[#2D5BE3] flex items-center gap-1 transition-colors w-fit"
                    >
                        <House size={14} />
                        Dashboard
                    </Link>

                    <nav className="flex items-center text-sm font-medium text-[#94A3B8] w-full lg:w-auto overflow-x-auto whitespace-nowrap">
                        <Link href="/courses" className="hover:text-[#2D5BE3] transition-colors">Courses</Link>
                        <span className="mx-1.5 text-border">›</span>
                        <Link href={`/courses/${courseId}`} className="hover:text-[#2D5BE3] transition-colors truncate max-w-[200px]">
                            {courseData.title}
                        </Link>
                        <span className="mx-1.5 text-border">›</span>
                        <span className="text-[#0F1A2E] font-medium truncate max-w-[200px]">{lesson.title}</span>
                    </nav>
                </header>

                {/* Lesson Payload */}
                <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 pb-32">

                    <div className="mb-10">
                        <h1 className="text-3xl md:text-4xl font-normal font-display text-text-primary mb-2">
                            {lesson.title}
                        </h1>
                        {lesson.duration_minutes > 0 && (
                            <p className="text-text-muted font-medium">Estimated time: {lesson.duration_minutes} mins</p>
                        )}
                    </div>

                    <div className="bg-surface rounded-2xl shadow-sm border border-border p-6 md:p-10 mb-12 min-h-[400px]">
                        {/* TYPE: VIDEO */}
                        {lesson.content_type === 'video' && lesson.content_url && (
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black shadow-inner flex flex-col justify-center items-center">
                                {getYoutubeEmbed(lesson.content_url) ? (
                                    <iframe
                                        src={getYoutubeEmbed(lesson.content_url)!}
                                        className="w-full h-full border-0"
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    />
                                ) : (
                                    <video
                                        controls
                                        className="w-full h-full object-contain"
                                        src={lesson.content_url}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                            </div>
                        )}

                        {/* TYPE: TEXT */}
                        {lesson.content_type === 'text' && (
                            <div
                                className="prose prose-slate prose-headings:font-display prose-headings:text-text-primary prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline max-w-none text-text-secondary leading-relaxed bg-surface"
                                dangerouslySetInnerHTML={{ __html: lesson.content_body || '<p>No content provided.</p>' }}
                            />
                        )}

                        {/* TYPE: FILE */}
                        {lesson.content_type === 'file' && (
                            <div className="flex flex-col items-center justify-center p-12 text-center bg-primary-light rounded-3xl border border-primary/10">
                                <FileText className="w-20 h-20 text-primary mb-8 opacity-20" />
                                <h3 className="text-3xl font-normal font-display text-text-primary mb-4">Download Resources</h3>
                                <p className="text-text-secondary max-w-md mb-10 text-lg">
                                    This lesson includes downloadable materials. Click the button below to save them to your device.
                                </p>
                                {lesson.content_url ? (
                                    <a
                                        href={lesson.content_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-10 py-4 bg-primary text-white font-bold rounded-full shadow-lg flex items-center gap-3 hover:bg-primary-hover transition-all hover:-translate-y-1 active:translate-y-0"
                                    >
                                        <Download className="w-5 h-5 text-white" />
                                        Download File
                                    </a>
                                ) : (
                                    <p className="text-error font-bold bg-error/10 border border-error/20 px-6 py-3 rounded-full uppercase tracking-widest text-xs">File URL is missing.</p>
                                )}
                            </div>
                        )}


                        {/* Fallback for unconfigured videos/content */}
                        {lesson.content_type === 'video' && !lesson.content_url && (
                            <div className="p-8 text-center text-foreground/50 border border-border rounded-lg bg-background">
                                Video URL is currently undefined for this lesson.
                            </div>
                        )}
                    </div>

                    {/* ALWAYS SHOW QUIZ AT BOTTOM IF QUESTIONS EXIST */}
                    {quizQuestions && quizQuestions.length > 0 && (
                        <div className="mb-12">
                            <QuizClient
                                courseId={courseId}
                                lessonId={lessonId}
                                questions={quizQuestions}
                            />
                        </div>
                    )}

                    {/* Bottom Actions Row */}
                    <div className="flex flex-col md:flex-row items-center justify-between border-t border-border pt-8 mt-12 gap-6">
                        <div className="w-full md:w-auto flex justify-start">
                            {prevLesson ? (
                                <Link
                                    href={`/courses/${courseId}/${prevLesson.id}`}
                                    className="flex items-center gap-2 px-6 py-3 text-primary font-semibold border border-primary hover:bg-primary-light rounded-full transition-colors duration-200 w-full md:w-auto justify-center"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Previous Lesson
                                </Link>
                            ) : (
                                <div className="invisible px-5 py-3 hidden md:block">Placeholder</div>
                            )}
                        </div>

                        <div className="w-full md:w-auto flex justify-center order-first md:order-none">
                            {/* Only show Mark as Complete if no quiz exists, OR if quiz passed */}
                            {(!quizQuestions || quizQuestions.length === 0) && (
                                <MarkCompleteButton
                                    courseId={courseId}
                                    lessonId={lessonId}
                                    isCompleted={currentLessonMeta.isCompleted}
                                />
                            )}
                            {quizQuestions && quizQuestions.length > 0 && currentLessonMeta.isCompleted && (
                                <div className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200 w-full md:w-auto">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    Lesson & Quiz Complete
                                </div>
                            )}
                        </div>

                        <div className="w-full md:w-auto flex justify-end">
                            {nextLesson ? (
                                <Link
                                    href={`/courses/${courseId}/${nextLesson.id}`}
                                    className="flex items-center gap-2 px-6 py-3 text-primary font-semibold border border-primary hover:bg-primary-light rounded-full transition-colors duration-200 w-full md:w-auto justify-center"
                                >
                                    Next Lesson
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                            ) : (
                                <div className="invisible px-5 py-3 hidden md:block">Placeholder</div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
