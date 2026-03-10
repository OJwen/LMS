'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabaseAdmin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function checkAdmin() {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
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

export async function inviteUser(formData: FormData) {
    if (!await checkAdmin()) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const email = formData.get('email') as string
    const full_name = formData.get('full_name') as string
    const department = formData.get('department') as string
    const role = formData.get('role') as string

    // Supabase admin invitation API.
    // The trigger `handle_new_user` captures full_name and role from metadata.
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name, role }
    })

    if (error) return { error: error.message }
    const adminUser = await checkAdmin()

    if (data.user) {
        await supabaseAdmin
            .from('profiles')
            .update({ department, is_active: true })
            .eq('id', data.user.id)

        if (adminUser) await logAudit(adminUser.id, 'INVITED_USER', data.user.id, { email, role, department })
    }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function updateUser(userId: string, formData: FormData) {
    const adminUser = await checkAdmin()
    if (!adminUser) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const department = formData.get('department') as string
    const role = formData.get('role') as string

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ department, role })
        .eq('id', userId)

    if (error) return { error: error.message }

    await logAudit(adminUser.id, 'UPDATED_USER_PROFILE', userId, { role, department })

    revalidatePath('/admin/users')
    return { success: true }
}

export async function toggleUserStatus(userId: string, is_active: boolean) {
    const adminUser = await checkAdmin()
    if (!adminUser) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_active })
        .eq('id', userId)

    if (error) return { error: error.message }

    await logAudit(adminUser.id, 'TOGGLED_USER_STATUS', userId, { is_active })

    revalidatePath('/admin/users')
    return { success: true }
}

export async function enrolUserInCourseAction(userId: string, formData: FormData) {
    const adminUser = await checkAdmin()
    if (!adminUser) return { error: 'Unauthorized' }
    const courseId = formData.get('course_id') as string

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from('enrolments')
        .upsert({ user_id: userId, course_id: courseId }, { onConflict: 'user_id, course_id' })

    if (error) return { error: error.message }

    await logAudit(adminUser.id, 'ENROLLED_USER', userId, { course_id: courseId })

    revalidatePath('/admin/users')
    return { success: true }
}

export async function removeUserFromCourseAction(userId: string, courseId: string) {
    const adminUser = await checkAdmin()
    if (!adminUser) return { error: 'Unauthorized' }
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
        .from('enrolments')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId)

    if (error) return { error: error.message }

    await logAudit(adminUser.id, 'REMOVED_USER_ENROLMENT', userId, { course_id: courseId })

    revalidatePath('/admin/users')
    return { success: true }
}
