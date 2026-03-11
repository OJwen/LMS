'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Loader2, Circle } from 'lucide-react'
import { submitQuizAction } from '@/app/courses/[id]/[lessonId]/actions'

type Question = {
    id: string
    question: string
    options: { label: string, value: string }[]
    correct_answer?: string
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
    const [submitted, setSubmitted] = useState(false)
    const [results, setResults] = useState<{
        score: number,
        passed: boolean,
        feedback: Record<string, { isCorrect: boolean, correctAnswer: string }>
    } | null>(null)

    const handleSelect = (questionId: string, value: string) => {
        if (submitted) return
        setAnswers(prev => ({ ...prev, [questionId]: value }))
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            const res = await submitQuizAction(courseId, lessonId, answers)
            if (res.success) {
                setResults({
                    score: res.score!,
                    passed: res.passed!,
                    feedback: res.feedback!
                })
                setSubmitted(true)
            }
        } catch (error) {
            console.error('Failed to submit quiz:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const allAnswered = questions.length > 0 && Object.keys(answers).length === questions.length

    return (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mt-6 shadow-sm">
            <h2 className="text-2xl font-normal font-display text-[#0F1A2E] mb-8">Knowledge Check</h2>

            <div className="space-y-10">
                {questions.map((q, idx) => {
                    const feedback = results?.feedback[q.id]
                    const isCorrect = feedback?.isCorrect
                    const hasSelected = answers[q.id] !== undefined
                    
                    return (
                        <div key={q.id}>
                            <p className="font-semibold text-[#0F1A2E] mb-4 text-lg">
                                {idx + 1}. {q.question}
                            </p>
                            <div className="space-y-3">
                                {q.options.map((opt) => {
                                    const isSelected = answers[q.id] === opt.value
                                    const isOptionCorrect = submitted && opt.value === feedback?.correctAnswer
                                    const isWrongSelection = submitted && isSelected && !isCorrect

                                    let buttonClass = "w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 "
                                    
                                    if (submitted) {
                                        if (isOptionCorrect) {
                                            buttonClass += "border-emerald-500 bg-emerald-50 text-emerald-700 "
                                        } else if (isWrongSelection) {
                                            buttonClass += "border-red-400 bg-red-50 text-red-700 "
                                        } else {
                                            buttonClass += "border-[#E2E8F0] opacity-60 "
                                        }
                                    } else {
                                        if (isSelected) {
                                            buttonClass += "border-[#2D5BE3] bg-[#EEF2FF] text-[#2D5BE3] "
                                        } else {
                                            buttonClass += "border-[#E2E8F0] hover:bg-[#EEF2FF] "
                                        }
                                    }

                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleSelect(q.id, opt.value)}
                                            disabled={submitted}
                                            className={buttonClass}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                isSelected 
                                                    ? 'border-[#2D5BE3] bg-[#2D5BE3]' 
                                                    : 'border-[#E2E8F0]'
                                            } ${submitted && (isOptionCorrect || isWrongSelection) ? 'hidden' : ''}`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            
                                            {submitted && isOptionCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                                            {submitted && isWrongSelection && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}

                                            <span className="flex-1 font-medium">{opt.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                            
                            {submitted && (
                                <div className="mt-3 text-sm font-medium">
                                    {isCorrect ? (
                                        <p className="text-emerald-600 flex items-center gap-1.5">
                                            <CheckCircle2 size={16} /> Correct!
                                        </p>
                                    ) : (
                                        <div className="text-red-500 flex flex-col gap-1.5">
                                            <p className="flex items-center gap-1.5">
                                                <XCircle size={16} /> Incorrect
                                            </p>
                                            <p className="text-[#64748B] text-xs font-normal">
                                                Correct answer: <span className="font-semibold">{q.options.find(o => o.value === feedback?.correctAnswer)?.label || feedback?.correctAnswer}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {!submitted ? (
                <div className="mt-10 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={!allAnswered || isSubmitting}
                        className={`px-10 py-3.5 bg-[#2D5BE3] text-white font-semibold rounded-xl transition-all ${
                            (!allAnswered || isSubmitting) 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'hover:bg-[#1E40AF] shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="animate-spin w-4 h-4" />
                                Submitting...
                            </span>
                        ) : 'Submit Quiz'}
                    </button>
                </div>
            ) : (
                <div className={`mt-10 p-6 rounded-2xl border ${results?.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        {results?.passed ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                        )}
                        <p className={`text-lg font-bold ${results?.passed ? 'text-emerald-800' : 'text-red-800'}`}>
                            {results?.passed ? 'Success! You passed the Knowledge Check.' : 'Keep trying! You didn\'t pass this time.'}
                        </p>
                    </div>
                    <p className={`text-base ${results?.passed ? 'text-emerald-700' : 'text-red-700'}`}>
                        Your score: <span className="font-bold">{results?.score}%</span> (Minimum 70% to pass)
                    </p>
                    {results?.passed && (
                        <p className="mt-4 text-emerald-700 text-sm bg-white/50 p-3 rounded-lg border border-emerald-100 italic">
                            This lesson has been automatically marked as complete.
                        </p>
                    )}
                    {!results?.passed && (
                        <button 
                            onClick={() => {
                                setSubmitted(false)
                                setResults(null)
                                setAnswers({})
                            }}
                            className="mt-4 inline-flex items-center px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
