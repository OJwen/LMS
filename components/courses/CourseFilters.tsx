'use client'

import { Search, Filter } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface CourseFiltersProps {
    searchQuery: string
    categoryFilter: string
    allCategories: string[]
}

export default function CourseFilters({ searchQuery, categoryFilter, allCategories }: CourseFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const q = formData.get('q') as string

        const params = new URLSearchParams(searchParams.toString())
        if (q) params.set('q', q)
        else params.delete('q')

        router.push(`/courses?${params.toString()}`)
    }

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const category = e.target.value
        const params = new URLSearchParams(searchParams.toString())

        if (category) params.set('category', category)
        else params.delete('category')

        router.push(`/courses?${params.toString()}`)
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-10 bg-surface p-4 rounded-2xl border border-border">
            <form onSubmit={handleSearch} className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-text-muted" />
                </div>
                <input
                    type="text"
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Search courses..."
                    className="block w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 sm:text-sm"
                />
            </form>

            <div className="w-full md:w-64 relative flex">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-text-muted" />
                </div>
                <select
                    name="category"
                    value={categoryFilter}
                    onChange={handleCategoryChange}
                    className="block w-full bg-surface border border-border rounded-xl pl-10 pr-10 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 sm:text-sm appearance-none cursor-pointer"
                >
                    <option value="">All Categories</option>
                    {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                </div>
            </div>
        </div>
    )
}
