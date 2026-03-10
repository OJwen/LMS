'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { CertificateDocument } from './CertificatePDF'

export default function DownloadCertificateLink({ profile, course }: { profile: any, course: any }) {
    return (
        <PDFDownloadLink
            document={<CertificateDocument studentName={profile.full_name || 'Student'} courseTitle={course.title} completionDate={course.completed_at} />}
            fileName={`Aligned-Certificate-${course.title.replace(/\s+/g, '-')}.pdf`}
            className="text-[10px] font-bold text-accent hover:text-primary transition underline border-none bg-transparent m-0 p-0"
        >
            Download PDF
        </PDFDownloadLink>
    )
}
