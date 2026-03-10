'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { submitOnboarding } from './actions'

const initialState = {
    error: null as string | null,
}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className={`w-full py-3 bg-primary text-white font-semibold rounded-md shadow transition ${pending ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'
                }`}
        >
            {pending ? 'Saving...' : 'Complete Profile'}
        </button>
    )
}

export default function Onboarding() {
    const [state, formAction] = useFormState(submitOnboarding, initialState)

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
            <div className="max-w-md w-full p-8 border border-border rounded-lg bg-primary-foreground shadow-sm">
                <h1 className="text-3xl font-bold font-heading text-primary text-center mb-2">
                    Almost There
                </h1>
                <p className="text-center text-foreground/80 mb-6 font-sans">
                    Welcome to Aligned Academy. Let's finish getting you set up.
                </p>

                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-primary" htmlFor="fullName">
                            Full Name
                        </label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="Jane Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-primary" htmlFor="department">
                            Department
                        </label>
                        <input
                            id="department"
                            name="department"
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="Consulting, Strategy..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-primary" htmlFor="password">
                            Set Account Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={8}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="Minimum 8 characters"
                        />
                        <p className="text-[10px] text-foreground/50 mt-1">You will use this to sign in next time.</p>
                    </div>

                    {state?.error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
                            {state.error}
                        </div>
                    )}

                    <SubmitButton />
                </form>
            </div>
        </div>
    )
}
