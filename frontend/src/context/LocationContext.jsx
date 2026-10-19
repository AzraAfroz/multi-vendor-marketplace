import { createContext, useContext, useEffect, useState } from 'react'

const LocationContext = createContext(null)

const STORAGE_KEY = 'shopverse_delivery_location'

const DEFAULT_LOCATION = {
  city: 'New York',
  pincode: '10001',
  state: 'NY',
  country: 'United States',
  isAutoDetected: false,
}

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return DEFAULT_LOCATION
  })

  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionError, setDetectionError] = useState('')
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
    } catch {
      // ignore
    }
  }, [location])

  /**
   * Auto-detect location via browser HTML5 Geolocation API and reverse geocoding
   */
  async function detectCurrentLocation() {
    if (!navigator.geolocation) {
      setDetectionError('Geolocation is not supported by your browser.')
      return
    }

    setIsDetecting(true)
    setDetectionError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude
          const lon = pos.coords.longitude

          // Free client reverse geocoding endpoint
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
          )

          if (!res.ok) throw new Error('Failed to resolve coordinates.')
          const data = await res.json()

          const detectedCity = data.city || data.locality || data.principalSubdivision || 'Detected City'
          const detectedPincode = data.postcode || ''
          const detectedState = data.principalSubdivision || ''
          const detectedCountry = data.countryName || 'Global'

          const nextLoc = {
            city: detectedCity,
            pincode: detectedPincode,
            state: detectedState,
            country: detectedCountry,
            latitude: lat,
            longitude: lon,
            isAutoDetected: true,
          }

          setLocation(nextLoc)
          setIsLocationModalOpen(false)
        } catch (err) {
          setDetectionError('Unable to identify location from GPS. You can enter your pincode manually.')
        } finally {
          setIsDetecting(false)
        }
      },
      (err) => {
        setIsDetecting(false)
        if (err.code === 1) {
          setDetectionError('Location access was denied. Please allow location permissions in your browser or enter your pincode below.')
        } else {
          setDetectionError('Unable to retrieve location coordinates.')
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  function setManualLocation(newLoc) {
    setLocation((prev) => ({
      ...prev,
      ...newLoc,
      isAutoDetected: false,
    }))
    setIsLocationModalOpen(false)
  }

  return (
    <LocationContext.Provider
      value={{
        location,
        isDetecting,
        detectionError,
        isLocationModalOpen,
        setIsLocationModalOpen,
        detectCurrentLocation,
        setManualLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useDeliveryLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useDeliveryLocation must be used within LocationProvider')
  return ctx
}
