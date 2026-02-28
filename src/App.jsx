import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import UploadScreen from './components/UploadScreen.jsx'
import MapView from './components/MapView.jsx'

export default function App() {
  const [screen, setScreen] = useState('upload')
  const [countryData, setCountryData] = useState(null)

  function handleDataReady(processedData) {
    setCountryData(processedData)
    setScreen('map')
  }

  function handleReset() {
    setCountryData(null)
    setScreen('upload')
  }

  return (
    <div className="w-full h-full bg-bg-primary">
      <AnimatePresence mode="wait">
        {screen === 'upload' && (
          <UploadScreen key="upload" onDataReady={handleDataReady} />
        )}
        {screen === 'map' && (
          <MapView key="map" countryData={countryData} onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  )
}
