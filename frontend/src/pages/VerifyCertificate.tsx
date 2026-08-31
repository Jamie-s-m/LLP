import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiCheckCircle, FiXCircle, FiAward } from 'react-icons/fi'
import api from '../services/api'

interface CertificateData {
  certificateId: string
  learnerName: string
  achievementType: 'course_completion' | 'level_readiness'
  cefrLevel: string
  courseTitle: string
  issuedAt: string
  status: 'active' | 'revoked'
  issuer: string
  methodology: string
  limitations: string
}

const ACHIEVEMENT_LABEL: Record<CertificateData['achievementType'], string> = {
  course_completion: 'Course Completion',
  level_readiness: 'Level Readiness',
}

export default function VerifyCertificate() {
  const { certificateId } = useParams()
  const [certificate, setCertificate] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!certificateId) return
    api.get(`/certificates/verify/${certificateId}`)
      .then((response) => setCertificate(response.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [certificateId])

  return (
    <div className="atlas-page px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="atlas-panel p-8 text-center">
          {loading ? (
            <p className="text-muted">Checking certificate...</p>
          ) : notFound || !certificate ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10">
                <FiXCircle size={28} />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-ink dark:text-white">Certificate not found</h1>
              <p className="text-sm text-muted">No LinguaNest certificate exists with this ID. Check the link and try again.</p>
            </>
          ) : (
            <>
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${certificate.status === 'active' ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'bg-red-100 text-red-600 dark:bg-red-500/10'}`}>
                {certificate.status === 'active' ? <FiAward size={28} /> : <FiXCircle size={28} />}
              </div>
              <p className="atlas-kicker">{certificate.issuer} Certificate of Achievement</p>
              <h1 className="mb-1 text-2xl font-bold text-ink dark:text-white">{certificate.learnerName}</h1>
              <p className="mb-6 text-sm text-muted">
                {ACHIEVEMENT_LABEL[certificate.achievementType]} · {certificate.cefrLevel} · {certificate.courseTitle}
              </p>

              {certificate.status === 'active' ? (
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-1.5 text-sm font-semibold text-success">
                  <FiCheckCircle /> Active — issued {new Date(certificate.issuedAt).toLocaleDateString()}
                </div>
              ) : (
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-sm font-semibold text-red-600 dark:bg-red-500/10">
                  <FiXCircle /> Revoked
                </div>
              )}

              <div className="mb-3 rounded-xl bg-[var(--surface-strong)] p-4 text-left text-xs text-muted">
                {certificate.methodology}
              </div>
              <div className="rounded-xl bg-[var(--surface-strong)] p-4 text-left text-xs text-muted">
                {certificate.limitations}
              </div>

              <p className="mt-6 font-mono text-xs text-muted">Certificate ID: {certificate.certificateId}</p>
            </>
          )}
          <Link to="/" className="mt-8 inline-block text-sm font-semibold text-[var(--accent)]">
            Go to LinguaNest
          </Link>
        </div>
      </div>
    </div>
  )
}
