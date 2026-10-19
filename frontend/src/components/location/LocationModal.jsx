import { useState } from 'react'
import { Check, Compass, Loader2, MapPin, Navigation, Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeliveryLocation } from '../../context/LocationContext.jsx'

const POPULAR_CITIES = [
  { city: 'New York', pincode: '10001', state: 'NY', country: 'US' },
  { city: 'Los Angeles', pincode: '90001', state: 'CA', country: 'US' },
  { city: 'London', pincode: 'EC1A 1BB', state: 'ENG', country: 'UK' },
  { city: 'Delhi', pincode: '110001', state: 'DL', country: 'IN' },
  { city: 'Mumbai', pincode: '400001', state: 'MH', country: 'IN' },
  { city: 'Bengaluru', pincode: '560001', state: 'KA', country: 'IN' },
  { city: 'Noida', pincode: '201301', state: 'UP', country: 'IN' },
  { city: 'Dubai', pincode: '00000', state: 'DXB', country: 'AE' },
]

export default function LocationModal() {
  const {
    location,
    isDetecting,
    detectionError,
    isLocationModalOpen,
    setIsLocationModalOpen,
    detectCurrentLocation,
    setManualLocation,
  } = useDeliveryLocation()

  const [pincodeInput, setPincodeInput] = useState('')
  const [cityInput, setCityInput] = useState('')

  if (!isLocationModalOpen) return null

  function handleManualApply(e) {
    e.preventDefault()
    if (!pincodeInput.trim() && !cityInput.trim()) return

    setManualLocation({
      city: cityInput.trim() || 'Custom City',
      pincode: pincodeInput.trim() || 'Custom ZIP',
      state: '',
      country: 'Selected Region',
    })
    setPincodeInput('')
    setCityInput('')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsLocationModalOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 z-10 space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-[#0a2e8c]/10 text-[#0a2e8c] grid place-items-center shrink-0">
              <MapPin size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Choose Your Delivery Location</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Delivery options, shipping fees, and vendor speeds vary by location.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Active Location Card */}
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Current Delivery Address
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {location.city} {location.pincode ? `(${location.pincode})` : ''} • {location.country || 'Global'}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-[#0a2e8c] bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
            Active
          </span>
        </div>

        {/* Auto Detect GPS Button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={detectCurrentLocation}
            disabled={isDetecting}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#0a2e8c] hover:bg-[#07226b] text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {isDetecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Detecting your live coordinates…</span>
              </>
            ) : (
              <>
                <Navigation size={16} />
                <span>Use My Current Location (GPS)</span>
              </>
            )}
          </button>

          {detectionError && (
            <p className="text-[11px] text-rose-600 font-medium px-1 leading-snug">
              {detectionError}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center text-xs text-slate-400">
          <div className="w-full border-t border-slate-200" />
          <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider absolute">
            or enter pincode
          </span>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={handleManualApply} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Pincode / ZIP Code</label>
              <input
                type="text"
                placeholder="e.g. 10001 or 110001"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0a2e8c]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">City Name</label>
              <input
                type="text"
                placeholder="e.g. New York or Delhi"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0a2e8c]"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Apply Location
          </button>
        </form>

        {/* Popular Delivery Cities Chips */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Popular Metro Hubs
          </span>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CITIES.map((c) => {
              const isSelected = location.city === c.city
              return (
                <button
                  key={c.city}
                  type="button"
                  onClick={() => setManualLocation(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0a2e8c] text-white shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{c.city}</span>
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
