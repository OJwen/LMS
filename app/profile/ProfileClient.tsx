'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { updateProfileAction, changePasswordAction } from './actions'
import { User, Award, ShieldCheck, Zap, BookOpen, Clock, Lock } from 'lucide-react'
import { toast } from 'sonner'

const DownloadCertificateLink = dynamic(() => import('@/components/courses/DownloadPDFLink'), {
    ssr: false,
    loading: () => <span className="text-xs text-primary/50">Preparing Document...</span>
})

export default function ProfileClient({
    user,
    profile,
    courses,
    achievements
}: {
    user: any,
    profile: any,
    courses: any[],
    achievements: any
}) {
    const [isSaving, setIsSaving] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
    const [uploading, setUploading] = useState(false)

    const [passwordState, setPasswordState] = useState({ state: '', msg: '' })

    const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        setUploading(true)

        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Math.random()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file)

        if (uploadError) {
            toast.error('Error uploading. Make sure "avatars" bucket exists and is public.')
            console.error(uploadError)
        } else {
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
            setAvatarUrl(data.publicUrl)
        }
        setUploading(false)
    }

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        formData.append('avatar_url', avatarUrl)

        const res = await updateProfileAction(formData)
        if (res.error) toast.error(res.error)
        else toast.success('Profile updated successfully!')

        setIsSaving(false)
    }

    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setPasswordState({ state: 'loading', msg: 'Updating password...' })
        const formData = new FormData(e.currentTarget)

        const res = await changePasswordAction(formData)
        if (res.error) {
            setPasswordState({ state: 'error', msg: res.error })
        } else {
            setPasswordState({ state: 'success', msg: 'Password successfully updated.' })
            e.currentTarget.reset()
        }
    }

    return (
        <div className="space-y-12 pb-20">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* LEFT COL: General Form */}
                <section className="col-span-1 md:col-span-2 space-y-8">

                    <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-xl shadow-sm border border-border">
                        <h2 className="text-2xl font-bold font-heading text-primary mb-6">Profile Settings</h2>

                        <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
                            <div className="relative group shrink-0">
                                <div className="w-28 h-28 rounded-full border-4 border-background shadow-md overflow-hidden bg-primary/10 flex items-center justify-center text-primary relative">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12" />
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-accent text-accent-foreground p-2 rounded-full shadow-md cursor-pointer hover:scale-110 transition z-10 border-2 border-white">
                                    <Edit className="w-4 h-4" />
                                    <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
                                </label>
                            </div>
                            <div className="flex-1 w-full text-center sm:text-left">
                                <p className="text-sm font-bold text-foreground/50 uppercase tracking-wider mb-2">Supabase Assigned Email</p>
                                <div className="flex items-center justify-center sm:justify-start gap-2 bg-primary/5 px-4 py-2 border border-border rounded-lg inline-flex max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                                    <Lock className="w-4 h-4 text-foreground/40 shrink-0" />
                                    <span className="text-foreground/80 font-medium truncate">{user.email}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-primary mb-2">Full Name</label>
                                    <input
                                        name="full_name"
                                        defaultValue={profile.full_name || ''}
                                        required
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-accent bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-primary mb-2">Department</label>
                                    <input
                                        name="department"
                                        defaultValue={profile.department || ''}
                                        required
                                        className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-accent bg-background"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`px-8 py-3 bg-primary text-white font-semibold rounded-md shadow transition ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'
                                        }`}
                                >
                                    {isSaving ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Change Password */}
                    <form onSubmit={handleChangePassword} className="bg-white p-8 rounded-xl shadow-sm border border-border">
                        <h2 className="text-xl font-bold font-heading text-primary mb-6">Security (Change Password)</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-2">New Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-accent bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-primary mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-accent bg-background"
                                />
                            </div>
                        </div>
                        {passwordState.msg && (
                            <div className={`p-4 rounded-lg mb-6 font-medium text-sm ${passwordState.state === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : passwordState.state === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700'}`}>
                                {passwordState.msg}
                            </div>
                        )}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={passwordState.state === 'loading'}
                                className="px-6 py-2 border-2 border-primary text-primary font-semibold rounded-md hover:bg-primary hover:text-white transition"
                            >
                                Update Password
                            </button>
                        </div>
                    </form>

                </section>

                {/* RIGHT COL: Achievements & Learning Journey */}
                <section className="space-y-8">
                    {/* Achievements Grid */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
                        <h3 className="text-lg font-bold font-heading text-primary flex items-center gap-2 mb-6">
                            <Award className="w-5 h-5 text-accent" /> Your Achievements
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className={`flex flex-col items-center p-4 rounded-lg text-center border transition ${achievements.firstCourse ? 'bg-accent/10 border-accent text-primary' : 'bg-background border-border text-foreground/40 grayscale opacity-50'}`}>
                                <ShieldCheck className={`w-8 h-8 mb-2 ${achievements.firstCourse ? 'text-accent' : ''}`} />
                                <span className="text-xs font-bold leading-tight uppercase tracking-wide">First Course</span>
                            </div>
                            <div className={`flex flex-col items-center p-4 rounded-lg text-center border transition ${achievements.fiveLessons ? 'bg-accent/10 border-accent text-primary' : 'bg-background border-border text-foreground/40 grayscale opacity-50'}`}>
                                <Zap className={`w-8 h-8 mb-2 ${achievements.fiveLessons ? 'text-accent' : ''}`} />
                                <span className="text-xs font-bold leading-tight uppercase tracking-wide">5 Lessons</span>
                            </div>
                            <div className={`flex flex-col items-center p-4 rounded-lg text-center border transition ${achievements.quizAce ? 'bg-accent/10 border-accent text-primary' : 'bg-background border-border text-foreground/40 grayscale opacity-50'}`}>
                                <Award className={`w-8 h-8 mb-2 ${achievements.quizAce ? 'text-accent' : ''}`} />
                                <span className="text-xs font-bold leading-tight uppercase tracking-wide">Quiz Ace</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-border h-full">
                        <h3 className="text-lg font-bold font-heading text-primary mb-6">My Learning Progress</h3>

                        <div className="space-y-6">
                            {courses.length > 0 ? courses.map(course => (
                                <div key={course.id} className="group">
                                    <div className="flex gap-4 mb-3">
                                        <div className="w-20 h-20 rounded-lg bg-primary/5 flex-shrink-0 border border-border overflow-hidden">
                                            {course.thumbnail_url ? (
                                                <img src={course.thumbnail_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary/20"><BookOpen className="w-6 h-6" /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/courses/${course.id}`} className="font-bold font-heading text-primary line-clamp-2 leading-snug group-hover:text-accent transition truncate mb-1">
                                                {course.title}
                                            </Link>
                                            {course.completed_at ? (
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="inline-block bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-200">
                                                        Completed on {new Date(course.completed_at).toLocaleDateString()}
                                                    </span>
                                                    <DownloadCertificateLink profile={profile} course={course} />
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-foreground/60 mb-1.5">
                                                    <Clock className="w-3 h-3" /> Started {new Date(course.enrolled_at).toLocaleDateString()}
                                                </span>
                                            )}
                                            <div className="flex items-center justify-between text-xs font-semibold mb-1 w-full">
                                                <span className="text-foreground/60">{course.completedCount}/{course.totalLessons} Lessons</span>
                                                <span className="text-accent">{Math.min(100, course.progressPercent)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-accent transition-all duration-700" style={{ width: `${Math.min(100, course.progressPercent)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-6">
                                    <BookOpen className="w-8 h-8 opacity-20 mx-auto mb-2 text-primary" />
                                    <p className="text-sm font-medium text-foreground/60 italic">You aren't enrolled in any courses yet.</p>
                                </div>
                            )}
                        </div>

                        <Link href="/courses" className="mt-6 w-full py-3 block text-center border-2 border-dashed border-primary/20 text-primary/70 font-bold rounded-lg hover:border-primary/50 hover:bg-white hover:text-primary transition">
                            Explore More Courses
                        </Link>
                    </div>
                </section>
            </div>

        </div>
    )
}

// Temporary internal lucide icon substitute missing export.
function Edit({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    )
}
