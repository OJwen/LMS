'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, PlayCircle, HelpCircle, BookOpen, FileText, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function getLessonIcon(type: string, completed: boolean, active: boolean) {
    const color = completed ? 'text-emerald-600' : active ? 'text-primary' : 'text-text-secondary'

    if (completed) return <CheckCircle className={`w-5 h-5 flex-shrink-0 ${color}`} />

    switch (type) {
        case 'video': return <PlayCircle className={`w-5 h-5 flex-shrink-0 ${color}`} />
        case 'quiz': return <HelpCircle className={`w-5 h-5 flex-shrink-0 ${color}`} />
        case 'file': return <BookOpen className={`w-5 h-5 flex-shrink-0 ${color}`} />
        case 'text':
        default: return <FileText className={`w-5 h-5 flex-shrink-0 ${color}`} />
    }
}

export default function CourseSidebar({
    courseId,
    modules
}: {
    courseId: string,
    modules: any[]
}) {
    const pathname = usePathname()
    const currentLessonId = pathname.split('/').pop()

    // Track expanded state for modules. Default all to true.
    const [openModules, setOpenModules] = useState<Record<string, boolean>>(
        modules.reduce((acc, m) => ({ ...acc, [m.id]: true }), {})
    )

    const toggleModule = (id: string) => {
        setOpenModules(prev => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <div className="w-full lg:w-80 flex-shrink-0 border-r border-border bg-white overflow-y-auto h-[calc(100vh-64px)] hidden lg:block custom-scrollbar">
            <Link
                href={`/courses/${courseId}`}
                className="flex items-center gap-2 px-4 py-4 text-sm font-semibold text-[#2D5BE3] border-b border-[#E2E8F0] hover:bg-[#F8F9FB] transition-colors group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Course
            </Link>

            <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold font-heading text-primary">Curriculum</h2>
            </div>

            <div className="divide-y divide-border">
                {modules.map((mod, idx) => (
                    <div key={mod.id}>
                        <button
                            onClick={() => toggleModule(mod.id)}
                            className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 transition text-left"
                        >
                            <div>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 shadow-sm px-2 py-0.5 bg-primary-light rounded-full inline-block">Module {idx + 1}</p>
                                <h3 className="text-sm font-bold font-display text-text-primary mt-1">{mod.title}</h3>
                            </div>
                            {openModules[mod.id] ? (
                                <ChevronDown className="w-5 h-5 text-text-muted" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-text-muted" />
                            )}
                        </button>

                        {openModules[mod.id] && (
                            <div className="bg-white">
                                {mod.lessons.map((lesson: any) => {
                                    const isActive = lesson.id === currentLessonId
                                    return (
                                        <Link
                                            key={lesson.id}
                                            href={`/courses/${courseId}/${lesson.id}`}
                                            className={`flex items-center p-4 pl-8 hover:bg-surface-alt transition-all border-l-4 ${isActive ? 'border-primary bg-primary-light/50' : 'border-transparent'
                                                }`}
                                        >
                                            {getLessonIcon(lesson.content_type, lesson.isCompleted, isActive)}
                                            <div className="ml-3">
                                                <p className={`text-sm font-semibold transition-colors ${isActive ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                                                    {lesson.title}
                                                </p>
                                                {lesson.duration_minutes > 0 && (
                                                    <p className="text-[10px] text-text-muted font-bold mt-0.5 uppercase tracking-wider">{lesson.duration_minutes} mins</p>
                                                )}
                                            </div>
                                        </Link>
                                    )
                                })}
                                {mod.lessons.length === 0 && (
                                    <div className="p-4 pl-8 text-xs text-foreground/50">No lessons.</div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
