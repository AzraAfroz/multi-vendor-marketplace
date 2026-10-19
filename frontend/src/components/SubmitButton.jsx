import { ArrowRight, LoaderCircle } from 'lucide-react'

export default function SubmitButton({ children, loading, className = '' }) {
  return <button className={`submit-button ${className}`} type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={17} /> Please wait…</> : <>{children}<ArrowRight size={17} /></>}</button>
}
