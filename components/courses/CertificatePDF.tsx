'use client'

import React from 'react'
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Define explicit styles for PDF mapping
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FAFAFA',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    border: {
        border: '4pt solid #1a2b4c', // primary dark navy
        padding: 30,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerBorder: {
        border: '1pt solid #C6A87C', // accent gold
        padding: 40,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 60,
        height: 60,
        marginRight: 15,
    },
    headerText: {
        fontSize: 24,
        color: '#1a2b4c',
        fontWeight: 'bold',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    titleWrapper: {
        marginBottom: 30,
        alignItems: 'center',
    },
    certTitle: {
        fontSize: 36,
        color: '#1a2b4c',
        letterSpacing: 4,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    presentedTo: {
        fontSize: 16,
        color: '#555555',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    studentName: {
        fontSize: 42,
        color: '#C6A87C', // Gold
        marginBottom: 30,
        fontWeight: 'bold',
    },
    reasonText: {
        fontSize: 14,
        color: '#333333',
        marginBottom: 10,
    },
    courseName: {
        fontSize: 24,
        color: '#1a2b4c',
        marginBottom: 40,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    dateStamp: {
        marginTop: 'auto',
        fontSize: 12,
        color: '#777777',
    }
})

interface CertificateProps {
    studentName: string
    courseTitle: string
    completionDate: string
}

export const CertificateDocument = ({ studentName, courseTitle, completionDate }: CertificateProps) => (
    <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
            <View style={styles.border}>
                <View style={styles.innerBorder}>

                    <View style={styles.headerRow}>
                        {/* Native text-based "logo" for simplicity without external image deps failing network */}
                        <Text style={styles.headerText}>ALIGNED ACADEMY</Text>
                    </View>

                    <View style={styles.titleWrapper}>
                        <Text style={styles.certTitle}>Certificate of Completion</Text>
                    </View>

                    <Text style={styles.presentedTo}>This is proudly presented to</Text>
                    <Text style={styles.studentName}>{studentName}</Text>

                    <Text style={styles.reasonText}>for successfully completing the curriculum and requirements of</Text>
                    <Text style={styles.courseName}>{courseTitle}</Text>

                    <Text style={styles.dateStamp}>Awarded on {new Date(completionDate).toLocaleDateString()}</Text>

                </View>
            </View>
        </Page>
    </Document>
)
