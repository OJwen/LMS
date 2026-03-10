'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { togglePublishCourse, deleteCourse } from './actions'

type Course = {
    id: string
    title: string
    category: string
    is_published: boolean
    created_at: string
    enrolmentCount: number
}

export default function AdminCourseTableClient({ courses: initialCourses }: { courses: Course[] }) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [isToggling, setIsToggling] = useState<string | null>(null)

    const handleToggle = async (id: string, currentStatus: boolean) => {
        setIsToggling(id)
        await togglePublishCourse(id, !currentStatus)
        setIsToggling(null)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you absolutely sure you want to delete this course and all its modules/lessons?')) return
        setIsDeleting(id)
        await deleteCourse(id)
        setIsDeleting(null)
    }

    return (
        <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-alt border-b border-border">
                            <th className="px-6 py-4 font-semibold text-text-primary uppercase text-xs tracking-wider">Title</th>
                            <th className="px-6 py-4 font-semibold text-text-primary uppercase text-xs tracking-wider">Category</th>
                            <th className="px-6 py-4 font-semibold text-text-primary uppercase text-xs tracking-wider">Status</th>
                            <th className="px-6 py-4 font-semibold text-text-primary uppercase text-xs tracking-wider">Enrolments</th>
                            <th className="px-6 py-4 font-semibold text-text-primary uppercase text-xs tracking-wider">Created</th>
                            <th className="px-6 py-4 font-semibold text-text-primary uppercase text-xs tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {initialCourses.map(course => (
                            <tr key={course.id} className="hover:bg-surface-alt/50 transition-colors duration-200">
                                <td className="px-6 py-4 font-medium text-text-primary">
                                    <span className="block truncate max-w-[200px]">{course.title}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-block bg-primary-light text-primary text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                                        {course.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {course.is_published ? (
                                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-200 uppercase tracking-wider">
                                            <Eye className="w-3.5 h-3.5" /> Published
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200 uppercase tracking-wider">
                                            <EyeOff className="w-3.5 h-3.5" /> Draft
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-text-secondary font-medium">
                                    {course.enrolmentCount}
                                </td>
                                <td className="px-6 py-4 text-text-muted text-sm">
                                    {new Date(course.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => handleToggle(course.id, course.is_published)}
                                            disabled={isToggling === course.id}
                                            className="p-2 text-text-muted hover:text-primary transition-colors duration-200 rounded-full hover:bg-primary-light disabled:opacity-50"
                                            title={course.is_published ? 'Unpublish' : 'Publish'}
                                        >
                                            {course.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <Link
                                            href={`/admin/courses/${course.id}/edit`}
                                            className="p-2 text-text-muted hover:text-primary transition-colors duration-200 rounded-full hover:bg-primary-light"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(course.id)}
                                            disabled={isDeleting === course.id}
                                            className="p-2 text-red-400 hover:text-red-500 transition-colors duration-200 rounded-full hover:bg-red-50 disabled:opacity-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {initialCourses.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-text-muted italic">
                                    No courses found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
