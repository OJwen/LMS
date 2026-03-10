'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginAction } from './actions'

const initialState = {
    error: null as string | null,
}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className={`w-full bg-[#2D5BE3] text-white font-semibold rounded-full px-6 py-2.5 transition-colors duration-200 mt-4 ${pending ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#1E45C7]'
                }`}
        >
            {pending ? 'Signing in...' : 'Sign In'}
        </button>
    )
}

export default function Login() {
    const [state, formAction] = useFormState(loginAction, initialState)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EEF2FF] via-white to-[#EEF2FF] p-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#EEF2FF]/80 via-transparent to-transparent opacity-60 mix-blend-multiply"></div>
            <div className="max-w-md w-full p-10 border border-border rounded-3xl bg-surface shadow-xl relative z-10">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5L12 2Z" />
                        <path d="M4.9 4.9L10 10L19.1 4.9L14 10L19.1 19.1L14 14L4.9 19.1L10 14L4.9 4.9Z" opacity="0.5" />
                    </svg>
                    <span className="font-bold text-2xl text-text-primary font-sans">Aligned</span>
                </div>
                <h1 className="text-4xl font-normal font-display text-text-primary text-center mb-2">
                    Welcome to Aligned Academy
                </h1>
                <p className="text-center text-text-secondary mb-8 font-sans">
                    Log in to access your dashboard
                </p>

                <form action={formAction} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-text-primary" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150"
                            placeholder="jane@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-text-primary" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150"
                            placeholder="••••••••"
                        />
                    </div>

                    {state?.error && (
                        <div className="p-3 bg-red-50 text-error rounded-xl text-sm border border-red-200">
                            {state.error}
                        </div>
                    )}

                    <SubmitButton />
                </form>
            </div>
        </div>
    )
}
