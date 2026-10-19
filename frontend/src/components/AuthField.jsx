import { Eye, EyeOff } from 'lucide-react'

export default function AuthField({ label, name, type = 'text', value, onChange, placeholder, autoComplete, error, toggle, visible, inputMode, maxLength }) {
  const inputType = toggle ? (visible ? 'text' : 'password') : type
  return <div className="field-wrap">
    <label htmlFor={name}>{label}</label>
    <div className={`input-shell ${error ? 'input-error' : ''}`}>
      <input id={name} name={name} type={inputType} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode} maxLength={maxLength} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} />
      {toggle && <button className="visibility-button" type="button" onClick={toggle} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
    </div>
    {error && <span className="field-error" id={`${name}-error`}>{error}</span>}
  </div>
}
