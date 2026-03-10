// Global shared types for Aligned Academy
export type UserProfile = {
    id: string;
    email: string;
    role: 'admin' | 'learner';
    created_at: string;
};

export type Course = {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    created_at: string;
    updated_at: string;
};

export type Lesson = {
    id: string;
    course_id: string;
    title: string;
    content: string;
    video_url?: string;
    order_index: number;
};
