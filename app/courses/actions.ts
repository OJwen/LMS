'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function enrolInCourse(formData: FormData): Promise<void | { error: string }> {
    const courseId = formData.get('courseId') as string
    if (!courseId) return { error: 'Invalid course ID' }

    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name: string, options: any) {
                    cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Check if they are already enrolled
    const { data: existing } = await supabase
        .from('enrolments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single()

    if (existing) {
        // Already enrolled, just redirect to course
        redirect(`/courses/${courseId}`)
    }

    // Insert new enrolment
    const { error } = await supabase
        .from('enrolments')
        .insert({
            user_id: user.id,
            course_id: courseId
        })

    if (error) {
        console.error('Enrolment error:', error)
        return { error: 'Failed to enrol in course. Please try again.' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/courses')
    revalidatePath(`/courses/${courseId}`)

    redirect(`/courses/${courseId}`)
}
