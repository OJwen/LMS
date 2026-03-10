import { createCourse } from '../actions'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewCoursePage() {
    async function handleSubmit(formData: FormData) {
        'use server'
        await createCourse(formData)
    }

    return (
        <div className="min-h-screen bg-background text-text-secondary font-sans transition-colors duration-500">
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Link href="/admin/courses" className="inline-flex items-center text-sm font-bold text-text-muted hover:text-primary transition-all mb-8 group">
                    <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Course Management
                </Link>
                <div className="mb-10">
                    <h1 className="text-5xl font-normal font-display text-text-primary mb-3">Create New Course</h1>
                    <p className="text-text-muted text-lg">Kickstart your new Aligned Academy resource.</p>
                </div>

                <div className="bg-surface p-10 rounded-3xl shadow-sm border border-border">
                    <form action={handleSubmit} className="space-y-8">
                        <div>
                            <label htmlFor="title" className="block text-sm font-semibold text-text-primary mb-3">Course Title</label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                required
                                placeholder="E.g., Management Consulting 101"
                                className="w-full px-5 py-4 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary text-lg"
                            />
                            <p className="text-sm text-text-muted mt-4 leading-relaxed">
                                This is the first step. You&apos;ll be able to add the full description, category badges, and build your curriculum on the following page.
                            </p>
                        </div>

                        <div className="flex justify-end pt-8 border-t border-border">
                            <button type="submit" className="px-10 py-3.5 bg-primary text-white font-semibold rounded-full shadow-md hover:bg-primary-hover transition-all hover:-translate-y-0.5 active:translate-y-0">
                                Create & Continue
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
