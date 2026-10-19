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
   * Returns Promise resolving with the detected location object { street, city, state, postalCode, pincode, country, latitude, longitude }
   */
  function detectCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        const err = new Error('Geolocation is not supported by your browser.')
        setDetectionError(err.message)
        reject(err)
        return
      }

      setIsDetecting(true)
      setDetectionError('')

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude
            const lon = pos.coords.longitude

            let detectedStreet = ''
            let detectedCity = 'Detected City'
            let detectedState = ''
            let detectedPincode = ''
            let detectedCountry = 'India'

            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                {
                  headers: { 'User-Agent': 'ShopVerseMarketplace/1.0 (contact@shopverse.market)' },
                }
              )
              if (res.ok) {
                const data = await res.json()
                const a = data.address || {}
                const streetParts = [a.house_number, a.road || a.street, a.suburb || a.neighbourhood || a.quarter].filter(Boolean)
                detectedStreet = streetParts.join(', ') || a.amenity || data.name || ''
                detectedCity = a.city || a.town || a.village || a.suburb || a.city_district || 'Detected City'
                detectedState = a.state || a.region || ''
                detectedPincode = a.postcode || ''
                detectedCountry = a.country || 'India'
              }
            } catch (fetchErr) {
              console.warn('[LocationContext] Reverse geocoding fallback:', fetchErr.message)
            }

            const nextLoc = {
              street: detectedStreet,
              city: detectedCity,
              pincode: detectedPincode,
              postalCode: detectedPincode,
              state: detectedState,
              country: detectedCountry,
              latitude: lat,
              longitude: lon,
              isAutoDetected: true,
            }

            setLocation(nextLoc)
            setIsLocationModalOpen(false)
            resolve(nextLoc)
          } catch (err) {
            setDetectionError('Unable to identify location from GPS. You can enter your address manually.')
            reject(err)
          } finally {
            setIsDetecting(false)
          }
        },
        (err) => {
          setIsDetecting(false)
          let msg = 'Unable to retrieve location coordinates.'
          if (err.code === 1) {
            msg = 'Location permission was denied. Please allow location access in your browser or enter your address manually.'
          } else if (err.code === 2) {
            msg = 'Location position unavailable. Please enter your address manually.'
          } else if (err.code === 3) {
            msg = 'Location request timed out. Please try again or enter your address manually.'
          }
          setDetectionError(msg)
          reject(new Error(msg))
        },
        { timeout: 10000, enableHighAccuracy: true }
      )
    })
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
