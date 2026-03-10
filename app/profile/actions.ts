'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function updateProfileAction(formData: FormData) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const full_name = formData.get('full_name') as string
    const department = formData.get('department') as string
    const avatar_url = formData.get('avatar_url') as string

    const { error } = await supabase
        .from('profiles')
        .update({ full_name, department, avatar_url })
        .eq('id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/profile')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function changePasswordAction(formData: FormData) {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match.' }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters.' }
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) return { error: error.message }

    return { success: true }
}
