'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Menu, X, LayoutDashboard, BookOpen, LogOut, Settings, User, House, ChevronDown } from 'lucide-react'

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const [session, setSession] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const pathname = usePathname()
    const router = useRouter()
    const userMenuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Initial session fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session?.user) {
                fetchProfile(session.user.id)
            }
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setProfile(null)
            }
        })

        // Close dropdown when clicking outside
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            subscription.unsubscribe()
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    async function fetchProfile(userId: string) {
        const { data } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role')
            .eq('id', userId)
            .single()
        if (data) setProfile(data)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    // Hide navbar on auth-related pages
    const isAuthPage = ['/login', '/auth/callback', '/onboarding'].some(path => pathname?.startsWith(path))
    if (isAuthPage) return null

    // If no session after loading, don't show (middleware should handle redirect)
    if (!session) return null

    const firstName = profile?.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || 'User'
    const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || session.user.email?.[0].toUpperCase() || 'U'

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard'
        return pathname?.startsWith(href)
    }

    const navLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Courses', href: '/courses', icon: BookOpen },
    ]

    if (profile?.role === 'admin') {
        navLinks.push({ name: 'Admin', href: '/admin', icon: Settings })
    }

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0] z-50 transition-all duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex justify-between items-center h-full">

                    {/* Left: Logo */}
                    <div className="flex items-center">
                        <Link href="/dashboard" className="flex items-center gap-2 group">
                            <div className="bg-[#2D5BE3] p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300">
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
                                    <path d="M4.9 4.9L10 10L19.1 4.9L14 10L19.1 19.1L14 14L4.9 19.1L10 14L4.9 4.9Z" opacity="0.3" />
                                </svg>
                            </div>
                            <span className="font-bold text-xl text-[#0F1A2E] font-sans">Aligned</span>
                            <span className="text-[10px] bg-[#EEF2FF] text-[#2D5BE3] border border-[#EEF2FF] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:block">Academy</span>
                        </Link>
                    </div>

                    {/* Centre: Main Nav Links (Desktop) */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 text-sm font-medium transition-all relative ${isActive(link.href)
                                    ? 'text-[#2D5BE3]'
                                    : 'text-[#4A5568] hover:text-[#0F1A2E]'
                                    }`}
                            >
                                {link.name}
                                {isActive(link.href) && (
                                    <span className="absolute bottom-[-18px] left-0 right-0 h-[2px] bg-[#2D5BE3] rounded-full"></span>
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Right: User Menu (Desktop) */}
                    <div className="hidden md:flex items-center" ref={userMenuRef}>
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-3 p-1 rounded-full hover:bg-[#F8F9FB] transition-colors border border-transparent hover:border-[#E2E8F0]"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#EEF2FF] border border-[#2D5BE3]/10 flex items-center justify-center text-[#2D5BE3] font-bold text-xs overflow-hidden">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt={firstName} className="w-full h-full object-cover" />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                <span className="text-sm font-semibold text-[#0F1A2E] pr-1">{firstName}</span>
                                <ChevronDown className={`w-4 h-4 text-[#4A5568] transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-2 animate-in fade-in zoom-in duration-200 origin-top-right">
                                    <Link
                                        href="/profile"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A5568] hover:text-[#0F1A2E] hover:bg-[#F8F9FB] rounded-xl transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        My Profile
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#4A5568] hover:text-[#0F1A2E] hover:bg-[#F8F9FB] rounded-xl transition-colors"
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </Link>
                                    <div className="h-px bg-[#E2E8F0] my-2 mx-1"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#EF4444] hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-xl text-[#4A5568] hover:bg-[#F8F9FB] transition-colors"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar/Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 top-16 bg-white z-40 animate-in slide-in-from-right duration-300">
                    <div className="flex flex-col p-4 gap-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-4 h-14 px-6 rounded-2xl text-lg font-semibold transition-all ${isActive(link.href)
                                    ? 'bg-[#EEF2FF] text-[#2D5BE3]'
                                    : 'text-[#0F1A2E] hover:bg-[#F8F9FB]'
                                    }`}
                            >
                                <link.icon className={`w-6 h-6 ${isActive(link.href) ? 'text-[#2D5BE3]' : 'text-[#4A5568]'}`} />
                                {link.name}
                            </Link>
                        ))}
                        <Link
                            href="/profile"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-4 h-14 px-6 rounded-2xl text-lg font-semibold text-[#0F1A2E] hover:bg-[#F8F9FB] transition-all"
                        >
                            <User className="w-6 h-6 text-[#4A5568]" />
                            My Profile
                        </Link>
                        <div className="h-px bg-[#E2E8F0] my-4 mx-6"></div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-4 h-14 px-6 rounded-2xl text-lg font-semibold text-[#EF4444] hover:bg-red-50 transition-all"
                        >
                            <LogOut className="w-6 h-6" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </nav>
    )
}
