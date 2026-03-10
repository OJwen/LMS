import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <h1 className="text-5xl font-bold font-heading text-primary mb-4">Aligned Academy</h1>
      <p className="text-xl text-foreground/80 mb-8 font-sans">Empowering your business consulting journey.</p>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition"
        >
          Login
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-accent text-accent-foreground font-semibold rounded-md shadow hover:bg-accent/90 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
