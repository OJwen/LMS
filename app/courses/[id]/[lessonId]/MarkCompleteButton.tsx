'use client'

import { useTransition } from 'react'
import { markLessonComplete } from './actions'
import { CheckCircle } from 'lucide-react'

export default function MarkCompleteButton({
    courseId,
    lessonId,
    isCompleted
}: {
    courseId: string,
    lessonId: string,
    isCompleted: boolean
}) {
    const [isPending, startTransition] = useTransition()

    if (isCompleted) {
        return (
            <div className="flex items-center justify-center gap-2 px-6 py-3 bg-green-50 text-green-700 font-semibold rounded-md border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Lesson Complete
            </div>
        )
    }

    return (
        <button
            onClick={() => {
                startTransition(() => {
                    markLessonComplete(courseId, lessonId)
                })
            }}
            disabled={isPending}
            className={`px-8 py-3 bg-primary text-white font-semibold rounded-full shadow transition flex items-center gap-2 ${isPending ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-hover active:scale-95'
                }`}
        >
            <CheckCircle className="w-5 h-5 text-white" />
            {isPending ? 'Marking...' : 'Mark as Complete'}
        </button>
    )
}
