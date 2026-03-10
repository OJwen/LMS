'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function submitOnboarding(prevState: any, formData: FormData) {
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

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const fullName = formData.get('fullName') as string
    const department = formData.get('department') as string
    const password = formData.get('password') as string

    if (!fullName || !department || !password) {
        return { error: 'Please provide your name, department, and a new password.' }
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, department })
        .eq('id', user.id)

    if (profileError) {
        return { error: profileError.message }
    }

    // Set password now that they are authenticated via link
    const { error: authError } = await supabase.auth.updateUser({ password })
    if (authError) {
        return { error: `Profile saved, but password failed: ${authError.message}` }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
