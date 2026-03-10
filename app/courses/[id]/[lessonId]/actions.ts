'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function markLessonComplete(courseId: string, lessonId: string) {
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
    if (!user) return { error: 'Not authenticated' }

    // 1. Mark lesson as complete
    const { error: progressError } = await supabase
        .from('lesson_progress')
        .upsert(
            { user_id: user.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() },
            { onConflict: 'user_id, lesson_id' }
        )

    if (progressError) {
        console.error('Error marking lesson complete:', progressError)
        return { error: progressError.message }
    }

    // 2. Check if all course lessons are completed
    const { data: courseData } = await supabase
        .from('courses')
        .select('modules(lessons(id))')
        .eq('id', courseId)
        .single()

    let totalCourseLessons = 0
    const allLessonIds = new Set<string>()

    if (courseData?.modules) {
        courseData.modules.forEach((m: any) => {
            if (m.lessons) {
                m.lessons.forEach((l: any) => {
                    totalCourseLessons++
                    allLessonIds.add(l.id)
                })
            }
        })
    }

    const { data: completedLessonsData } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('completed', true)

    const userCompletedIds = new Set(completedLessonsData?.map(p => p.lesson_id) || [])

    let completedCount = 0
    allLessonIds.forEach(id => {
        if (userCompletedIds.has(id)) completedCount++
    })

    // 3. If all complete, update enrolment
    if (totalCourseLessons > 0 && completedCount >= totalCourseLessons) {
        await supabase
            .from('enrolments')
            .update({ completed_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .is('completed_at', null) // Only update if not already completed
    }

    revalidatePath(`/courses/${courseId}`)
    revalidatePath(`/courses/${courseId}/${lessonId}`)
    revalidatePath('/dashboard')

    return { success: true }
}

export async function submitQuizAction(courseId: string, lessonId: string, userAnswers: Record<string, string>) {
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
    if (!user) return { error: 'Not authenticated' }

    // Fetch true questions and answers
    const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, correct_answer')
        .eq('lesson_id', lessonId)

    if (!questions) return { error: 'Quiz not found' }

    let correctCount = 0
    questions.forEach(q => {
        if (userAnswers[q.id] === q.correct_answer) {
            correctCount++
        }
    })

    let score = 0
    if (questions.length > 0) {
        score = Math.round((correctCount / questions.length) * 100)
    }

    const passed = score >= 80 // 80% to pass

    // Record attempt
    await supabase
        .from('quiz_attempts')
        .insert({
            user_id: user.id,
            lesson_id: lessonId,
            score,
            passed
        })

    // If passed, mark lesson complete
    if (passed) {
        await markLessonComplete(courseId, lessonId)
    }

    return { success: true, score, passed }
}
