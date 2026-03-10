export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center text-center px-4">
            <h1 className="font-display text-6xl text-[#0F1A2E] mb-4">404</h1>
            <p className="text-[#4A5568] mb-8">
                This page doesn't exist or you don't have access.
            </p>
            <a href="/dashboard"
                className="bg-[#2D5BE3] text-white font-semibold rounded-full px-6 py-2.5 hover:bg-[#1E45C7] transition-colors">
                Back to Dashboard
            </a>
        </div>
    )
}
