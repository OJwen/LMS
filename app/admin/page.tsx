import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, Users, ClipboardList, ArrowRight, ArrowLeft } from 'lucide-react'

export default async function AdminPanel() {
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
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') redirect('/dashboard')

    const cards = [
        {
            title: 'Course Management',
            description: 'Create, edit, and organize all Aligned Academy resources, modules, and lessons.',
            href: '/admin/courses',
            icon: <BookOpen className="w-8 h-8 text-primary" />,
            color: 'bg-primary-light'
        },
        {
            title: 'User Management',
            description: 'Manage all learners and administrators, track progress, and manual enrollments.',
            href: '/admin/users',
            icon: <Users className="w-8 h-8 text-primary" />,
            color: 'bg-primary-light'
        },
        {
            title: 'Audit Logs',
            description: 'Monitor platform activity, security events, and administrative changes.',
            href: '/admin/audit',
            icon: <ClipboardList className="w-8 h-8 text-primary" />,
            color: 'bg-primary-light'
        }
    ]

    return (
        <div className="min-h-screen bg-background text-text-secondary font-sans pb-20">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

                <div className="mb-6 -mt-4">
                    <Link
                        href="/dashboard"
                        className="text-sm text-[#2D5BE3] hover:underline flex items-center gap-1 font-medium transition-all"
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>
                </div>

                <header className="mb-16 border-b border-border pb-10">
                    <h1 className="text-6xl font-normal font-display text-text-primary mb-4 tracking-tight">Admin Dashboard</h1>
                    <p className="text-xl text-text-muted max-w-2xl">The command center for Aligned Academy. Manage institutional excellence from one beautiful place.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cards.map((card) => (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="group bg-surface p-10 rounded-3xl border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col items-start"
                        >
                            <div className={`${card.color} p-4 rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-300`}>
                                {card.icon}
                            </div>
                            <h2 className="text-2xl font-normal font-display text-text-primary mb-4">{card.title}</h2>
                            <p className="text-text-muted mb-8 text-lg leading-relaxed">{card.description}</p>
                            <div className="mt-auto flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase">
                                Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    )
}
