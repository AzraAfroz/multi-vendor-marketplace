
import { useState } from 'react'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthField from '../../components/AuthField.jsx'
import SubmitButton from '../../components/SubmitButton.jsx'
import { apiErrorMessage, forgotPasswordRequest } from '../../services/authService.js'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [loading, setLoading] = useState(false)
  async function submit(e) {
    e.preventDefault(); setNotice(''); setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return }
    setLoading(true)
    try { await forgotPasswordRequest({ email: email.trim() }); setNotice('If an account exists for that email, you’ll receive a reset link shortly.') }
    catch (err) { setNotice(apiErrorMessage(err)) }
    finally { setLoading(false) }
  }
  return <><Link className="back-link" to="/login"><ArrowLeft size={16} /> Back to sign in</Link><div className="form-heading forgot-heading"><span className="icon-badge"><MailCheck size={21} /></span><span className="step-label">ACCOUNT RECOVERY</span><h2>Forgot your password?</h2><p>No worries. Enter the email linked to your account and we’ll help you get back in.</p></div>
    {notice && <div className="notice" role="status">{notice}</div>}
    <form onSubmit={submit} noValidate><AuthField label="Email address" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" error={error} /><SubmitButton loading={loading}>Send reset link</SubmitButton></form>
    <p className="switch-auth">Remembered your password? <Link to="/login">Sign in</Link></p>
  </>
}
