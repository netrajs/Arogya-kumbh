import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useClinic } from '../lib/store'
import { DaikoLogo } from '../components/ui/DaikoLogo'

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function DisplayBoard() {
  const { state, roomsForSite, getRoomQueue, getStaffName } = useClinic()
  const [searchParams, setSearchParams] = useSearchParams()
  const now = useClock()

  const siteId = searchParams.get('site')
  const site = state.sites.find((s) => s.id === siteId)

  if (!site) {
    return (
      <div className="app-canvas flex min-h-screen flex-col items-center justify-center gap-8 p-10 font-body-md">
        <DaikoLogo className="h-16 w-16" />
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Which site is this screen for?</h1>
        <div className="flex flex-wrap gap-4">
          {state.sites.map((s) => (
            <button
              key={s.id}
              onClick={() => setSearchParams({ site: s.id })}
              className="rounded-full bg-primary px-8 py-4 font-headline-md text-headline-md text-on-primary shadow-[0_8px_22px_rgba(91,63,228,0.35)]"
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const rooms = roomsForSite(site.id)

  return (
    <div className="app-canvas min-h-screen p-10 font-body-md">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <DaikoLogo className="h-12 w-12" />
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Arogya Kumbh Clinic</h1>
            <p className="text-body-lg text-on-surface-variant">{site.name} · Now Serving</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display-stat text-[40px] font-bold leading-none text-primary">
            {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-meta text-on-surface-variant">
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => {
          const queue = getRoomQueue(room.id)
          const serving = queue.find((v) => v.status === 'in_consultation')
          const upNext = queue.filter((v) => v.status !== 'in_consultation').slice(0, 6)

          return (
            <div key={room.id} className="card-surface flex flex-col items-center p-10 text-center">
              <p className="font-headline-md text-headline-md text-on-surface">{room.name}</p>
              <p className="mb-6 text-body-md text-on-surface-variant">
                {room.currentDoctorId ? getStaffName(room.currentDoctorId) : 'Unattended'}
              </p>

              <p className="font-label-caps text-label-caps uppercase text-primary">Now Serving</p>
              {serving ? (
                <p className="my-2 font-display-stat text-[96px] font-bold leading-none text-primary">
                  {serving.tokenNumber}
                </p>
              ) : (
                <p className="my-6 text-body-lg text-on-surface-variant">No patient in consultation</p>
              )}

              <div className="mt-6 w-full border-t border-outline-variant/60 pt-6">
                <p className="mb-3 font-label-caps text-label-caps uppercase text-on-surface-variant">Up Next</p>
                {upNext.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant">Queue clear</p>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {upNext.map((v) => (
                      <span
                        key={v.id}
                        className={
                          'flex h-12 min-w-12 items-center justify-center rounded-full px-3 font-headline-md text-headline-md font-semibold ' +
                          (v.isEmergency ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-surface-container-low text-on-surface')
                        }
                      >
                        {v.tokenNumber}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {rooms.length === 0 && (
          <p className="text-body-lg text-on-surface-variant">No OPD rooms configured for this site.</p>
        )}
      </div>
    </div>
  )
}
