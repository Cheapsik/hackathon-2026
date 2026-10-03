import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { GlassPanel, SegmentedControl, SelectField, SoftButton } from '@/design-system'
import { templatePreviews } from './template-registry'

const viewports = ['375', '390', '430', '768', '1024', '1440'] as const
type Viewport = (typeof viewports)[number]

const frameHeight: Record<Viewport, number> = {
  '375': 812,
  '390': 844,
  '430': 932,
  '768': 1024,
  '1024': 860,
  '1440': 900,
}

/**
 * Renders one template in an iframe at a real viewport width — media queries inside respond as on a device.
 * Wider frames scroll inside the panel; the page itself never overflows.
 */
export function TemplateViewer() {
  const [templateId, setTemplateId] = useState(templatePreviews[0].id)
  const [viewport, setViewport] = useState<Viewport>('390')
  const preview = templatePreviews.find((candidate) => candidate.id === templateId) ?? templatePreviews[0]
  const [state, setState] = useState(preview.states[0].value)
  const src = `/design-system/szablon/${preview.id}?stan=${state}`

  return (
    <div className="grid gap-4">
      <GlassPanel padding="md" className="grid gap-4 md:grid-cols-[minmax(0,16rem)_1fr] md:items-end">
        <SelectField
          label="Szablon"
          value={templateId}
          onChange={(event) => {
            const next = templatePreviews.find((candidate) => candidate.id === event.target.value)
            if (next) {
              setTemplateId(next.id)
              setState(next.states[0].value)
            }
          }}
          options={templatePreviews.map((candidate) => ({ value: candidate.id, label: candidate.label }))}
        />
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-2">
            <span className="text-label font-medium">Szerokość</span>
            <div className="scrollbar-none max-w-full overflow-x-auto">
              <SegmentedControl
                label="Szerokość podglądu"
                size="sm"
                value={viewport}
                onValueChange={setViewport}
                options={viewports.map((value) => ({ value, label: value }))}
              />
            </div>
          </div>
          {preview.states.length > 1 && (
            <div className="grid gap-2">
              <span className="text-label font-medium">Stan</span>
              <SegmentedControl
                label="Stan szablonu"
                size="sm"
                value={state}
                onValueChange={setState}
                options={preview.states}
              />
            </div>
          )}
          <SoftButton asChild variant="ghost" icon={<ExternalLink aria-hidden />}>
            <a href={src} target="_blank" rel="noreferrer">
              Otwórz osobno
            </a>
          </SoftButton>
        </div>
      </GlassPanel>

      <div className="overflow-x-auto rounded-panel bg-canvas p-4 md:p-6">
        <iframe
          key={src}
          title={`Szablon ${preview.label}, ${viewport} px`}
          src={src}
          width={Number(viewport)}
          height={frameHeight[viewport]}
          className="mx-auto block max-w-none rounded-shell border border-border-highlight bg-app shadow-floating"
        />
      </div>
    </div>
  )
}
