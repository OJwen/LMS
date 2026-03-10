import { Skeleton } from "@/components/ui/Skeleton"

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-10 text-center md:text-left border-b border-border pb-6">
                    <Skeleton className="h-10 w-3/4 max-w-sm mb-4" />
                    <Skeleton className="h-5 w-64" />
                </div>

                {/* Stats Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-border">
                            <Skeleton className="h-5 w-32 mb-4" />
                            <Skeleton className="h-10 w-20" />
                        </div>
                    ))}
                </div>

                {/* Grid Row */}
                <div className="space-y-6">
                    <Skeleton className="h-8 w-48 mb-6" />
                    <div className="flex gap-6 overflow-hidden">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                                <Skeleton className="h-48 w-full" />
                                <div className="p-6">
                                    <Skeleton className="h-6 w-3/4 mb-3" />
                                    <Skeleton className="h-4 w-full mb-8" />
                                    <Skeleton className="h-10 w-full rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}
