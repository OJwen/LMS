'use client'

import { useState } from 'react'
import { submitQuizAction } from '@/app/courses/[id]/[lessonId]/actions'

type Question = {
    id: string
    question: string
    options: { label: string, value: string }[]
}

export default function QuizClient({
    courseId,
    lessonId,
    questions
}: {
    courseId: string,
    lessonId: string,
    questions: Question[]
}) {
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{ score: number, passed: boolean } | null>(null)

    const handleSelect = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }))
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        const res = await submitQuizAction(courseId, lessonId, answers)
        if (res.success) {
            setResult({ score: res.score!, passed: res.passed! })
        }
        setIsSubmitting(false)
    }

    if (result) {
        return (
            <div className={`p-10 rounded-3xl border-2 text-center shadow-sm ${result.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <h3 className={`text-4xl font-normal font-display mb-4 ${result.passed ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {result.passed ? 'Quiz Passed!' : 'Quiz Failed'}
                </h3>
                <p className={`text-2xl font-bold mb-8 ${result.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                    You scored: {result.score}%
                </p>

                {!result.passed && (
                    <button
                        onClick={() => {
                            setResult(null)
                            setAnswers({})
                        }}
                        className="px-10 py-4 bg-rose-600 text-white font-bold rounded-full hover:bg-rose-700 transition-all shadow-md hover:-translate-y-1"
                    >
                        Try Again
                    </button>
                )}

                {result.passed && (
                    <p className="text-emerald-700 font-bold bg-white/50 py-3 px-6 rounded-full inline-block border border-emerald-200 shadow-sm">
                        Lesson has been automatically marked as complete. You can continue to the next lesson.
                    </p>
                )}
            </div>
        )
    }

    const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length

    return (
        <div className="space-y-8">
            {questions.map((q, idx) => (
                <div key={q.id} className="bg-white p-6 border border-border rounded-xl shadow-sm">
                    <h4 className="font-bold text-lg text-primary mb-4">
                        {idx + 1}. {q.question}
                    </h4>
                    <div className="space-y-4">
                        {q.options.map(opt => (
                            <label
                                key={opt.value}
                                className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 group ${answers[q.id] === opt.value ? 'bg-primary-light border-primary shadow-sm' : 'hover:bg-surface-alt border-border hover:border-text-muted/30'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name={`question-${q.id}`}
                                    value={opt.value}
                                    checked={answers[q.id] === opt.value}
                                    onChange={() => handleSelect(q.id, opt.value)}
                                    className="w-5 h-5 text-primary border-border focus:ring-primary"
                                />
                                <span className={`ml-4 font-bold text-lg transition-colors ${answers[q.id] === opt.value ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            {questions.length > 0 && (
                <div className="pt-4 border-t border-border mt-8 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={!allAnswered || isSubmitting}
                        className={`px-12 py-4 bg-primary text-white font-bold rounded-full shadow-lg transition-all ${(!allAnswered || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-hover hover:-translate-y-1 active:translate-y-0'
                            }`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                </div>
            )}

            {questions.length === 0 && (
                <div className="p-12 text-center text-text-muted border border-dashed border-border rounded-2xl bg-surface">
                    No questions have been configured for this quiz yet.
                </div>
            )}
        </div>
    )
}
