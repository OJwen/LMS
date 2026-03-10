'use client'

import { useState } from 'react'
import { Plus, GripVertical, Trash2, Edit2, X } from 'lucide-react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    addModule,
    updateModule,
    deleteModule,
    addLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
    addQuizQuestion,
    deleteQuizQuestion
} from '../../actions'

function SortableLessonItem({ lesson, onEdit, onDelete }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: lesson.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-border shadow-sm mb-3 hover:border-primary/30 transition-all group z-10 relative"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-text-muted hover:text-primary transition-colors p-1">
                <GripVertical className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <span className="font-semibold text-text-primary">{lesson.title}</span>
                <span className="ml-3 text-[10px] bg-primary-light text-primary px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-primary/10">
                    {lesson.content_type}
                </span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(lesson)} className="p-2 text-text-muted hover:text-primary transition-colors rounded-full hover:bg-primary-light">
                    <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(lesson.id)} className="p-2 text-text-muted hover:text-red-500 transition-colors rounded-full hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

export default function CurriculumBuilder({ courseId, initialModules }: { courseId: string, initialModules: any[] }) {
    const [modules, setModules] = useState([...initialModules])
    const [lessonModal, setLessonModal] = useState<{ isOpen: boolean, moduleId: string, lesson?: any }>({ isOpen: false, moduleId: '' })

    // Specific state for Quiz Questions while in Lesson Modal
    const [quizQuestions, setQuizQuestions] = useState<any[]>([])

    // Local state for exactly what contentType is currently selected in Modal
    const [contentType, setContentType] = useState('video')

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleAddModule = async () => {
        const title = prompt('Module Title:')
        if (!title) return
        const position = modules.length
        const res = await addModule(courseId, title, position)
        if (res.success) {
            setModules([...modules, { id: res.moduleId, title, position, lessons: [] }])
        }
    }

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm('Delete this module and all its contents?')) return
        await deleteModule(moduleId)
        setModules(modules.filter(m => m.id !== moduleId))
    }

    const handleDragEnd = async (event: any, moduleId: string) => {
        const { active, over } = event
        if (!over || active.id === over.id) return

        let modIndex = modules.findIndex(m => m.id === moduleId)
        const oldIndex = modules[modIndex].lessons.findIndex((l: any) => l.id === active.id)
        const newIndex = modules[modIndex].lessons.findIndex((l: any) => l.id === over.id)

        const newLessons = arrayMove(modules[modIndex].lessons, oldIndex, newIndex)

        const newModules = [...modules]
        newModules[modIndex].lessons = newLessons
        setModules(newModules)

        const updates = newLessons.map((l: any, i) => ({ id: l.id, position: i }))
        await reorderLessons(updates)
    }

    const openLessonModal = (moduleId: string, lesson?: any) => {
        setLessonModal({ isOpen: true, moduleId, lesson })
        setContentType(lesson?.content_type || 'video')
        // We would need to fetch exact quiz questions from DB here if `lesson` has `content_type === quiz` and we want to edit.
        // For simplicity, we just empty it or rely on a placeholder logic if building a new quiz.
        setQuizQuestions([])
    }

    const closeLessonModal = () => {
        setLessonModal({ isOpen: false, moduleId: '' })
        setQuizQuestions([])
    }

    const addLocalQuizQuestion = () => {
        setQuizQuestions([...quizQuestions, {
            id: `temp-${Date.now()}`,
            question: '',
            options: [
                { label: '', value: 'A' },
                { label: '', value: 'B' },
                { label: '', value: 'C' },
                { label: '', value: 'D' }
            ],
            correct_answer: 'A'
        }])
    }

    const removeLocalQuizQuestion = (id: string) => {
        setQuizQuestions(quizQuestions.filter(q => q.id !== id))
    }

    const updateLocalQuestion = (id: string, field: string, value: string) => {
        setQuizQuestions(quizQuestions.map(q => q.id === id ? { ...q, [field]: value } : q))
    }

    const updateLocalOption = (qId: string, optIdx: number, val: string) => {
        setQuizQuestions(quizQuestions.map(q => {
            if (q.id === qId) {
                const newOpts = [...q.options]
                newOpts[optIdx].label = val
                return { ...q, options: newOpts }
            }
            return q
        }))
    }

    const handleSaveLesson = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const title = formData.get('title') as string
        const content_url = formData.get('content_url') as string
        const content_body = formData.get('content_body') as string
        const duration_minutes = parseInt(formData.get('duration_minutes') as string || '0')
        const position = lessonModal.lesson ? lessonModal.lesson.position : modules.find(m => m.id === lessonModal.moduleId)?.lessons.length || 0

        const payload = { title, content_type: contentType, content_url, content_body, duration_minutes, position }

        let savedLessonId = lessonModal.lesson?.id
        if (lessonModal.lesson) {
            await updateLesson(savedLessonId, payload)
        } else {
            const res = await addLesson(lessonModal.moduleId, payload)
            if (res.success) savedLessonId = res.lessonId
        }

        // Save quiz questions specifically
        if (contentType === 'quiz' && savedLessonId && quizQuestions.length > 0) {
            // Loop map to save into quiz_questions using addQuizQuestion
            // In production, you'd batch this or run UPSERTS.
            for (let i = 0; i < quizQuestions.length; i++) {
                const q = quizQuestions[i]
                // only inserts new due to simplicity in this block
                if (q.id.startsWith('temp-')) {
                    await addQuizQuestion(savedLessonId, {
                        question: q.question,
                        options: q.options,
                        correct_answer: q.correct_answer,
                        position: i
                    })
                }
            }
        }

        if (savedLessonId) {
            const newModules = modules.map(m => {
                if (m.id === lessonModal.moduleId) {
                    let updatedLessons = [...m.lessons]
                    if (lessonModal.lesson) {
                        updatedLessons = updatedLessons.map(l => l.id === savedLessonId ? { id: savedLessonId, ...payload } : l)
                    } else {
                        updatedLessons.push({ id: savedLessonId, ...payload })
                    }
                    return { ...m, lessons: updatedLessons }
                }
                return m
            })
            setModules(newModules)
        }

        closeLessonModal()
    }

    const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
        if (!confirm('Are you sure you want to delete this lesson?')) return
        await deleteLesson(lessonId)
        setModules(modules.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.filter((l: any) => l.id !== lessonId) } : m))
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-normal font-display text-text-primary">Curriculum Builder</h2>
                <button onClick={handleAddModule} className="px-6 py-2.5 bg-primary text-white font-semibold rounded-full shadow-md flex items-center gap-2 hover:bg-primary-hover transition-all hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" /> Add Module
                </button>
            </div>

            {modules.map((mod, modIdx) => (
                <div key={mod.id} className="bg-surface rounded-2xl border border-border p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
                        <h3 className="text-2xl font-normal font-display text-text-primary flex items-center gap-3">
                            <span className="text-primary text-[10px] font-bold tracking-widest uppercase bg-primary-light px-2 py-0.5 rounded-full shadow-sm">Module {modIdx + 1}</span>
                            {mod.title}
                        </h3>
                        <button
                            onClick={() => handleDeleteModule(mod.id)}
                            className="px-4 py-2 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors border border-red-100"
                        >
                            Delete Module
                        </button>
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, mod.id)}>
                        <div className="min-h-[50px] space-y-2 mb-4">
                            <SortableContext items={mod.lessons} strategy={verticalListSortingStrategy}>
                                {mod.lessons.map((lesson: any) => (
                                    <SortableLessonItem
                                        key={lesson.id}
                                        lesson={lesson}
                                        onEdit={(l: any) => openLessonModal(mod.id, l)}
                                        onDelete={(lId: string) => handleDeleteLesson(mod.id, lId)}
                                    />
                                ))}
                            </SortableContext>
                            {mod.lessons.length === 0 && (
                                <div className="text-center p-8 bg-surface-alt border border-dashed border-border rounded-xl text-text-muted text-sm italic">
                                    No lessons added yet. Click &quot;Add Lesson to Module&quot; to get started.
                                </div>
                            )}
                        </div>
                    </DndContext>

                    <button
                        onClick={() => openLessonModal(mod.id)}
                        className="w-full py-4 border-2 border-dashed border-primary/20 text-primary font-bold rounded-xl hover:border-primary/50 hover:bg-primary-light/30 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" /> Add Lesson to Module
                    </button>
                </div>
            ))}

            {modules.length === 0 && (
                <div className="p-16 border-2 border-dashed border-border rounded-3xl text-center bg-surface shadow-sm">
                    <p className="text-lg font-medium text-text-secondary mb-6 italic">This course currenty has no modules. Start organizing your content below.</p>
                    <button onClick={handleAddModule} className="px-10 py-3.5 bg-primary text-white font-bold rounded-full shadow-lg inline-flex items-center gap-2 hover:bg-primary-hover transition-all hover:-translate-y-1 active:translate-y-0">
                        <Plus className="w-5 h-5 text-white" /> Create First Module
                    </button>
                </div>
            )}

            {/* LESSON MODAL */}
            {lessonModal.isOpen && (
                <div className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-border">
                        <form onSubmit={handleSaveLesson} className="flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b border-border bg-surface flex justify-between items-center sticky top-0 z-10">
                                <h3 className="text-2xl font-normal font-display text-text-primary">
                                    {lessonModal.lesson ? 'Edit Lesson' : 'Add New Lesson'}
                                </h3>
                                <button type="button" onClick={closeLessonModal} className="text-text-muted hover:text-text-primary hover:bg-surface-alt rounded-full p-2 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                <div>
                                    <label className="block text-sm font-semibold text-text-primary mb-2">Lesson Title</label>
                                    <input name="title" defaultValue={lessonModal.lesson?.title} required className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary" />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-text-primary mb-2">Content Type</label>
                                        <select
                                            name="content_type"
                                            value={contentType}
                                            onChange={(e) => setContentType(e.target.value)}
                                            className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary cursor-pointer appearance-none"
                                        >
                                            <option value="video">Video</option>
                                            <option value="text">Rich Text</option>
                                            <option value="quiz">Interactive Quiz</option>
                                            <option value="file">Downloadable File/PDF</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-text-primary mb-2">Duration (Minutes)</label>
                                        <input name="duration_minutes" type="number" defaultValue={lessonModal.lesson?.duration_minutes || 0} min="0" className="w-full px-4 py-2 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary" />
                                    </div>
                                </div>

                                {/* Conditional Rendering purely based on content type */}
                                {(contentType === 'video' || contentType === 'file') && (
                                    <div className="pt-2">
                                        <label className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">
                                            {contentType === 'video' ? 'Video URL' : 'File Storage URL'}
                                        </label>
                                        <input name="content_url" defaultValue={lessonModal.lesson?.content_url} className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary" placeholder="https://..." />
                                    </div>
                                )}

                                {contentType === 'text' && (
                                    <div className="pt-2">
                                        <label className="block text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">Text Content (Markdown / HTML)</label>
                                        <textarea name="content_body" defaultValue={lessonModal.lesson?.content_body} rows={8} className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary" placeholder="Type text payload here..." />
                                    </div>
                                )}

                                {contentType === 'quiz' && (
                                    <div className="pt-6 border-t border-border mt-4">
                                        <div className="flex justify-between items-center mb-6">
                                            <label className="block text-sm font-semibold text-text-primary">Quiz Questions</label>
                                            <button type="button" onClick={addLocalQuizQuestion} className="text-xs font-bold bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-hover transition-colors shadow-sm">
                                                + Add Question
                                            </button>
                                        </div>

                                        <div className="space-y-8">
                                            {quizQuestions.map((q, qIdx) => (
                                                <div key={q.id} className="p-6 bg-surface-alt border border-border rounded-2xl relative">
                                                    <button type="button" onClick={() => removeLocalQuizQuestion(q.id)} className="absolute top-6 right-6 text-text-muted hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>

                                                    <div className="mb-6 pr-10">
                                                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Question {qIdx + 1}</label>
                                                        <input
                                                            type="text"
                                                            value={q.question}
                                                            onChange={(e) => updateLocalQuestion(q.id, 'question', e.target.value)}
                                                            required
                                                            className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary"
                                                            placeholder="What is the definition of..."
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                                        {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                                                            <div key={letter} className="flex flex-col">
                                                                <label className="text-[10px] uppercase font-bold text-text-muted mb-1.5 ml-1">Option {letter}</label>
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    value={q.options[optIdx]?.label}
                                                                    onChange={(e) => updateLocalOption(q.id, optIdx, e.target.value)}
                                                                    className="px-4 py-2 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Correct Answer</label>
                                                        <select
                                                            value={q.correct_answer}
                                                            onChange={(e) => updateLocalQuestion(q.id, 'correct_answer', e.target.value)}
                                                            className="w-full px-4 py-2 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-primary appearance-none cursor-pointer"
                                                        >
                                                            <option value="A">Option A</option>
                                                            <option value="B">Option B</option>
                                                            <option value="C">Option C</option>
                                                            <option value="D">Option D</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                            {quizQuestions.length === 0 && (
                                                <div className="text-center py-10 border border-dashed border-border rounded-2xl bg-surface">
                                                    <p className="text-sm text-text-muted italic">No questions added yet. Add one to enable the quiz properly.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-border bg-surface flex justify-end gap-3 sticky bottom-0 z-10 shadow-lg">
                                <button type="button" onClick={closeLessonModal} className="px-6 py-2.5 border border-border bg-surface text-text-secondary font-semibold rounded-full hover:bg-surface-alt transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="px-8 py-2.5 bg-primary text-white font-semibold rounded-full shadow-md hover:bg-primary-hover transition-all hover:-translate-y-0.5">
                                    Save Lesson
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
