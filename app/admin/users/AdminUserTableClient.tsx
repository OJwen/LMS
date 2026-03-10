'use client'

import { useState } from 'react'
import {
    inviteUser,
    updateUser,
    toggleUserStatus,
    enrolUserInCourseAction,
    removeUserFromCourseAction
} from './actions'
import { Search, Filter, Edit, ShieldBan, ShieldCheck, MailPlus, User, GraduationCap, X, CheckCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminUserTableClient({ users, allCourses }: { users: any[], allCourses: any[] }) {
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [deptFilter, setDeptFilter] = useState('')

    // Modals
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [editModalUser, setEditModalUser] = useState<any>(null)
    const [slideUser, setSlideUser] = useState<any>(null)

    // Derived filters matching
    const filteredUsers = users.filter(u => {
        const term = search.toLowerCase()
        const matchesSearch = u.full_name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
        const matchesRole = roleFilter ? u.role === roleFilter : true
        const matchesDept = deptFilter ? u.department === deptFilter : true
        return matchesSearch && matchesRole && matchesDept
    })

    // Unique Departments mapped dynamically
    const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean)))

    // Action Handlers
    const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const res = await inviteUser(formData)
        if (res.success) {
            setInviteModalOpen(false)
            toast.success('Invitation sent successfully')
        } else toast.error(res.error)
    }

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const res = await updateUser(editModalUser.id, formData)
        if (res.success) {
            setEditModalUser(null)
            toast.success('User updated successfully')
        } else toast.error(res.error)
    }

    const handleToggleActive = async (id: string, currentlyActive: boolean) => {
        if (!confirm(currentlyActive ? 'Suspend this user from logging in?' : 'Restore logging in access?')) return
        await toggleUserStatus(id, !currentlyActive)
    }

    const handleEnrol = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const res = await enrolUserInCourseAction(slideUser.id, formData)
        if (res.success) toast.success('Enrolled User smoothly. Changes reflect momentarily.')
        else toast.error(res.error)
    }

    const handleRemoveEnrolment = async (courseId: string) => {
        if (!confirm('Remove user from course progress entirely?')) return
        const res = await removeUserFromCourseAction(slideUser.id, courseId)
        if (res.success) toast.success('Removed manually')
        else toast.error(res.error)
    }

    return (
        <div>
            {/* Top Filter Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex flex-1 gap-4 items-center bg-white p-3 rounded-xl border border-border w-full md:w-auto shadow-sm">
                    <div className="relative flex-1">
                        <Search className="w-5 h-5 absolute left-3 top-2.5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-primary focus:border-primary active:ring-primary"
                        />
                    </div>
                    <div className="relative w-48 hidden md:block">
                        <Filter className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-sm cursor-pointer focus:ring-primary focus:border-primary"
                        >
                            <option value="">All Roles</option>
                            <option value="admin">Admins</option>
                            <option value="staff">Staff</option>
                        </select>
                    </div>
                    <div className="relative w-48 hidden lg:block">
                        <Filter className="w-4 h-4 absolute left-3 top-3 text-foreground/40" />
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-sm cursor-pointer"
                        >
                            <option value="">All Departments</option>
                            {departments.map((d: any) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                <button
                    onClick={() => setInviteModalOpen(true)}
                    className="w-full md:w-auto px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md flex items-center justify-center gap-2 hover:bg-primary-hover transition-all active:scale-95"
                >
                    <MailPlus className="w-5 h-5 text-white" /> Invite User
                </button>
            </div>

            {/* Main Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-primary/5 border-b border-border">
                                <th className="px-6 py-4 font-semibold text-primary uppercase text-xs tracking-wider">User</th>
                                <th className="px-6 py-4 font-semibold text-primary uppercase text-xs tracking-wider">Role & Dept</th>
                                <th className="px-6 py-4 font-semibold text-primary uppercase text-xs tracking-wider text-center">Enrolments</th>
                                <th className="px-6 py-4 font-semibold text-primary uppercase text-xs tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold text-primary uppercase text-xs tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-background/50 transition">
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSlideUser(u)}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                                                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" /> : <User className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-primary group-hover:text-primary transition-colors">{u.full_name}</p>
                                                <p className="text-xs text-text-muted font-medium">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold mr-2 uppercase tracking-wide border ${u.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' : 'bg-primary-light text-primary border-primary/10 shadow-sm'}`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                        <span className="text-sm font-semibold text-text-secondary">{u.department}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-primary cursor-pointer hover:bg-accent/5 rounded-lg transition" onClick={() => setSlideUser(u)}>
                                        {u.enrolmentCount}
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.is_active ? (
                                            <span className="inline-flex items-center text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                                                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                                                <ShieldBan className="w-3.5 h-3.5 mr-1" /> Revoked
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditModalUser(u)} className="p-2 text-text-muted hover:text-primary transition-all rounded-full hover:bg-primary-light" title="Edit Role & Dept">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleToggleActive(u.id, u.is_active)} className={`p-2 transition rounded-md ${u.is_active ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-green-500 hover:bg-green-50 hover:text-green-700'}`} title={u.is_active ? 'Deactivate Login' : 'Restore Login'}>
                                                {u.is_active ? <ShieldBan className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr><td colSpan={5} className="py-12 text-center text-foreground/50">No users found matching query.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* INVITE NEW USER MODAL */}
            {inviteModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleInvite} className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-border bg-primary/5 flex justify-between items-center">
                            <h3 className="text-xl font-bold font-heading text-primary">Invite Team Member</h3>
                            <button type="button" onClick={() => setInviteModalOpen(false)} className="text-foreground/50 hover:text-primary p-2">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-foreground/70 mb-4">They will receive an email linking them to securely set up a password and login directly.</p>
                            <div><label className="block text-sm font-semibold mb-1">Email</label><input type="email" name="email" required className="w-full px-4 py-2 border border-border rounded-lg bg-background" /></div>
                            <div><label className="block text-sm font-semibold mb-1">Full Name</label><input type="text" name="full_name" required className="w-full px-4 py-2 border border-border rounded-lg bg-background" /></div>
                            <div><label className="block text-sm font-semibold mb-1">Department</label><input type="text" name="department" required className="w-full px-4 py-2 border border-border rounded-lg bg-background" /></div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Role Configuration</label>
                                <select name="role" defaultValue="staff" className="w-full px-4 py-2 border border-border rounded-lg bg-background">
                                    <option value="staff">Staff Learner (Dashboard UI Only)</option>
                                    <option value="admin">Administrator (Full Backstage Access)</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-border flex justify-end gap-3 bg-primary/5">
                            <button type="submit" className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-md shadow hover:bg-primary/90">Send Invite Link</button>
                        </div>
                    </form>
                </div>
            )}

            {/* EDIT USER ROLE/DEPT MODAL */}
            {editModalUser && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleEdit} className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6 border-b border-border bg-primary/5">
                            <h3 className="text-xl font-bold font-heading text-primary flex justify-between">
                                Modify User <button type="button" onClick={() => setEditModalUser(null)} className="text-foreground/50 hover:text-primary text-sm font-sans">✕</button>
                            </h3>
                            <p className="text-xs text-foreground/60 mt-1">{editModalUser.email}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Department Change</label>
                                <input type="text" name="department" defaultValue={editModalUser.department} className="w-full px-4 py-2 border border-border rounded-lg bg-background" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Role Modification</label>
                                <select name="role" defaultValue={editModalUser.role} className="w-full px-4 py-2 border border-border rounded-lg bg-background">
                                    <option value="staff">Staff</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-border flex justify-end">
                            <button type="submit" className="w-full px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-md shadow hover:bg-primary/90">Update Profile Map</button>
                        </div>
                    </form>
                </div>
            )}

            {/* SLIDE-OVER ENROLMENT PANEL */}
            {slideUser && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={() => setSlideUser(null)} />
                    <div className="fixed inset-y-0 right-0 max-w-md w-full bg-background shadow-2xl z-50 transform overflow-y-auto border-l border-border transition-transform">
                        <div className="p-6 border-b border-border bg-white flex justify-between items-start sticky top-0 z-10">
                            <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                                    {slideUser.avatar_url ? <img src={slideUser.avatar_url} className="w-full h-full rounded-full object-cover" /> : <User className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold font-heading text-primary">{slideUser.full_name}</h3>
                                    <p className="text-sm font-medium text-foreground/60 flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> {slideUser.enrolmentCount} Map(s)</p>
                                </div>
                            </div>
                            <button onClick={() => setSlideUser(null)} className="p-2 text-foreground/50 hover:text-primary rounded-full hover:bg-black/5 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <form onSubmit={handleEnrol} className="bg-white p-5 rounded-xl shadow-sm border border-border">
                                <h4 className="text-sm font-bold text-primary mb-3">Force Enrol in Course</h4>
                                <div className="flex gap-2">
                                    <select name="course_id" className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background">
                                        {allCourses.filter(c => !slideUser.enrolments.some((e: any) => e.course_id === c.id)).map(c => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                    <button type="submit" className="px-4 py-2 bg-accent text-accent-foreground font-semibold text-sm rounded-lg shadow-sm hover:bg-accent/90 transition whitespace-nowrap">
                                        Force Enrol
                                    </button>
                                </div>
                            </form>

                            <div>
                                <h4 className="text-lg font-bold font-heading text-primary mb-4 pb-2 border-b border-border">Current Enrolments</h4>
                                <div className="space-y-3">
                                    {slideUser.enrolments.map((enr: any) => (
                                        <div key={enr.course_id} className="bg-white p-4 rounded-xl border border-border flex justify-between items-center shadow-sm">
                                            <div className="pr-4">
                                                <p className="font-bold text-primary text-sm truncate w-48">{enr.course_title}</p>
                                                {enr.completed_at ? (
                                                    <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Finished</p>
                                                ) : (
                                                    <p className="text-xs text-accent font-bold mt-1">In Progress...</p>
                                                )}
                                            </div>
                                            <button onClick={() => handleRemoveEnrolment(enr.course_id)} className="text-red-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition border border-transparent hover:border-red-200" title="Revoke Enrolment Map">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {slideUser.enrolments.length === 0 && (
                                        <div className="text-center p-6 bg-white border border-dashed border-border rounded-xl text-foreground/50 text-sm">
                                            No active enrolments mapped to this user.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
