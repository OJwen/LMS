'use client'

import { useState } from 'react'
import { updateCourse } from '../../actions'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

export default function CourseForm({
    course
}: {
    course: any
}) {
    const [isSaving, setIsSaving] = useState(false)
    const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url || '')
    const [uploading, setUploading] = useState(false)

    // Direct client usage with ANON key for bucket storage payload. 
    // Make sure RLS or bucket permissions allow authenticated users/admins to upload.
    const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        setUploading(true)

        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `course_thumbnails/${fileName}`

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { error: uploadError } = await supabase.storage
            .from('courses')
            .upload(filePath, file)

        if (uploadError) {
            toast.error('Error uploading image. Is the "courses" storage bucket configured publically?')
            console.error(uploadError)
        } else {
            const { data } = supabase.storage.from('courses').getPublicUrl(filePath)
            setThumbnailUrl(data.publicUrl)
        }
        setUploading(false)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSaving(true)
        const formData = new FormData(e.currentTarget)
        formData.append('thumbnail_url', thumbnailUrl)

        const res = await updateCourse(course.id, formData)
        if (res.error) toast.error(res.error)
        else toast.success('Course details updated securely')
        setIsSaving(false)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-2xl shadow-sm border border-border space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">Title</label>
                        <input
                            name="title"
                            defaultValue={course.title}
                            required
                            className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-text-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">Category Badge</label>
                        <input
                            name="category"
                            defaultValue={course.category || ''}
                            placeholder="E.g., Strategy, Operations"
                            className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-text-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">Description</label>
                        <textarea
                            name="description"
                            defaultValue={course.description || ''}
                            rows={4}
                            className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-text-primary resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-surface-alt p-4 rounded-xl border border-border group cursor-pointer hover:bg-border/20 transition-colors">
                        <input
                            type="checkbox"
                            name="is_published"
                            value="true"
                            defaultChecked={course.is_published}
                            id="is_published"
                            className="w-5 h-5 text-primary border-border focus:ring-primary/20 rounded-md transition cursor-pointer"
                        />
                        <label htmlFor="is_published" className="text-sm font-medium text-text-primary cursor-pointer">
                            Publish Course (Make visible to learners)
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-semibold text-text-primary mb-2">Course Thumbnail</label>
                    <div className="border border-dashed border-border rounded-2xl p-6 bg-surface-alt flex flex-col items-center justify-center text-center">
                        {thumbnailUrl ? (
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm mb-6 border border-border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={thumbnailUrl} alt="Thumbnail preview" className="object-cover w-full h-full" />
                            </div>
                        ) : (
                            <div className="aspect-video w-full bg-primary-light rounded-xl mb-6 flex items-center justify-center text-text-muted text-sm font-medium border border-border border-dashed">
                                No image uploaded
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            onChange={uploadImage}
                            disabled={uploading}
                            className="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover transition-colors cursor-pointer"
                        />
                        {uploading && <p className="text-xs text-primary mt-3 animate-pulse font-medium">Uploading image...</p>}
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-border flex justify-end">
                <button
                    type="submit"
                    disabled={isSaving}
                    className={`px-10 py-3 bg-primary text-white font-semibold rounded-full shadow-md transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                >
                    {isSaving ? 'Saving Changes...' : 'Save Course Details'}
                </button>
            </div>
        </form>
    )
}
