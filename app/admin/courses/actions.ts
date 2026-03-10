'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function checkAdmin() {
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
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return null
    return user
}

async function logAudit(actorId: string, action: string, targetId?: string, metadata?: any) {
    const supabaseAdmin = createAdminClient()
    await supabaseAdmin.from('audit_logs').insert({ actor_id: actorId, action, target_id: targetId, metadata })
}

// ============== COURSES ==============

export async function createCourse(formData: FormData) {
    const adminUser = await checkAdmin()
    if (!adminUser) return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin
        .from('courses')
        .insert({
            title,
            created_by: adminUser.id,
            is_published: false
        })
        .select('id')
        .single()

    if (error) return { error: error.message }

    await logAudit(adminUser.id, 'CREATED_COURSE', data.id, { title })

    revalidatePath('/admin/courses')
    redirect(`/admin/courses/${data.id}/edit`)
}

export async function updateCourse(courseId: string, formData: FormData) {
    const adminUser = await checkAdmin()
    if (!adminUser) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const is_published = formData.get('is_published') === 'true'
    const thumbnail_url = formData.get('thumbnail_url') as string

    const { error } = await supabaseAdmin
        .from('courses')
        .update({ title, description, category, is_published, thumbnail_url, updated_at: new Date().toISOString() })
        .eq('id', courseId)

    if (error) return { error: error.message }

    await logAudit(adminUser.id, 'UPDATED_COURSE', courseId, { title, category })

    revalidatePath(`/admin/courses/${courseId}/edit`)
    revalidatePath('/admin/courses')
    revalidatePath('/courses')
    revalidatePath(`/courses/${courseId}`)

    return { success: true }
}

export async function togglePublishCourse(courseId: string, is_published: boolean) {
    const adminUser = await checkAdmin()
    if (!adminUser) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from('courses')
        .update({ is_published, updated_at: new Date().toISOString() })
        .eq('id', courseId)

    if (error) return { error: error.message }

    await logAudit(adminUser.id, is_published ? 'PUBLISHED_COURSE' : 'UNPUBLISHED_COURSE', courseId)

    revalidatePath('/admin/courses')
    revalidatePath('/courses')
    revalidatePath(`/courses/${courseId}`)
    return { success: true }
}

export async function deleteCourse(courseId: string) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from('courses')
        .delete()
        .eq('id', courseId)

    if (error) return { error: error.message }

    revalidatePath('/admin/courses')
    revalidatePath('/courses')
    return { success: true }
}

// ============== MODULES ==============

export async function addModule(courseId: string, title: string, position: number) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin
        .from('modules')
        .insert({ course_id: courseId, title, position })
        .select('id')
        .single()

    if (error) return { error: error.message }
    revalidatePath(`/admin/courses/${courseId}/edit`)
    return { success: true, moduleId: data.id }
}

export async function updateModule(moduleId: string, title: string) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from('modules')
        .update({ title })
        .eq('id', moduleId)

    if (error) return { error: error.message }
    return { success: true }
}

export async function deleteModule(moduleId: string) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from('modules')
        .delete()
        .eq('id', moduleId)

    if (error) return { error: error.message }
    return { success: true }
}

// ============== LESSONS ==============

export async function addLesson(moduleId: string, lessonData: any) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin
        .from('lessons')
        .insert({ module_id: moduleId, ...lessonData })
        .select('id')
        .single()

    if (error) return { error: error.message }
    return { success: true, lessonId: data.id }
}

export async function updateLesson(lessonId: string, lessonData: any) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from('lessons')
        .update(lessonData)
        .eq('id', lessonId)

    if (error) return { error: error.message }
    return { success: true }
}

export async function deleteLesson(lessonId: string) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from('lessons')
        .delete()
        .eq('id', lessonId)

    if (error) return { error: error.message }
    return { success: true }
}

export async function reorderLessons(updates: { id: string, position: number, module_id?: string }[]) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    // Use Promise.all since upserting multiple items with different module_ids works too, but we will just map updates
    const promises = updates.map(u =>
        supabaseAdmin
            .from('lessons')
            .update({ position: u.position, ...(u.module_id ? { module_id: u.module_id } : {}) })
            .eq('id', u.id)
    )

    await Promise.all(promises)
    return { success: true }
}

// ============== QUIZZES ==============

export async function addQuizQuestion(lessonId: string, questionData: any) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const { data, error } = await supabaseAdmin
        .from('quiz_questions')
        .insert({ lesson_id: lessonId, ...questionData })
        .select('id')
        .single()

    if (error) return { error: error.message }
    return { success: true, questionId: data.id }
}

export async function deleteQuizQuestion(questionId: string) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from('quiz_questions')
        .delete()
        .eq('id', questionId)

    if (error) return { error: error.message }
    return { success: true }
}
