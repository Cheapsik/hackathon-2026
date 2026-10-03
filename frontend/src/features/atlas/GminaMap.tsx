import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface GminaProperties {
  teryt: string
}

interface GminaMapProps {
  /** A value per seven-digit TERYT. Gminy without a value stay pale. */
  values?: ReadonlyMap<string, number>
  /** Drawn with a stronger outline, e.g. the gmina of a fit card. */
  highlightTeryt?: string
  label: string
}

const boundaryUrl = '/geo/gminy-malopolskie.geojson'

/**
 * Małopolska's gminy (simplified PRG boundaries). The numbers live in the table next to the map; the colours only
 * repeat them.
 */
export function GminaMap({ values, highlightTeryt, label }: GminaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const valuesRef = useRef(values)
  const valuesKey = values ? [...values.entries()].map(([teryt, value]) => `${teryt}:${value}`).join(';') : ''

  useEffect(() => {
    valuesRef.current = values
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const currentValues = valuesRef.current
    const map = L.map(container, { scrollWheelZoom: false, attributionControl: false })
    const controller = new AbortController()
    let layer: L.GeoJSON | undefined

    void fetch(boundaryUrl, { signal: controller.signal })
      .then((response) => response.json())
      .then((collection: GeoJSON.FeatureCollection<GeoJSON.Geometry, GminaProperties>) => {
        if (controller.signal.aborted) {
          return
        }

        const numbers = [...(currentValues?.values() ?? [])]
        const min = numbers.length > 0 ? Math.min(...numbers) : 0
        const max = numbers.length > 0 ? Math.max(...numbers) : 0
        layer = L.geoJSON(collection, {
          style: (feature) => {
            const teryt = feature?.properties?.teryt ?? ''
            const value = currentValues?.get(teryt)
            const highlighted = teryt === highlightTeryt
            return {
              color: highlighted ? '#1a1a1a' : '#4a5568',
              weight: highlighted ? 3 : 1,
              fillColor: value === undefined ? '#e6e6e6' : shade(value, min, max),
              fillOpacity: 0.85,
            }
          },
        }).addTo(map)
        map.fitBounds(layer.getBounds(), { padding: [8, 8] })
      })
      .catch(() => undefined)

    return () => {
      controller.abort()
      map.remove()
    }
  }, [valuesKey, highlightTeryt])

  return (
    <figure>
      <div ref={containerRef} style={{ height: '28rem' }} />
      <figcaption>{label}</figcaption>
    </figure>
  )
}

function shade(value: number, min: number, max: number): string {
  if (max === min) {
    return 'hsl(210 45% 55%)'
  }

  const ratio = (value - min) / (max - min)
  const lightness = 88 - ratio * 50
  return `hsl(210 50% ${lightness}%)`
}
