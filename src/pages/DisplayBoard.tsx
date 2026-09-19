import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useClinic } from '../lib/store'
import { DaikoLogo } from '../components/ui/DaikoLogo'
import { Badge } from '../components/ui/Badge'
import { MIcon } from '../components/ui/MIcon'

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
  // An unattended room with nobody queued has nothing to tell a patient —
  // drop it from the board entirely. An unattended room that already has
  // patients waiting (reception can register into it before a doctor logs
  // in) still matters to them, so it stays, with an honest "not open yet"
  // state instead of a misleading "no patient in consultation".
  const visibleRooms = rooms.filter((room) => room.currentDoctorId || getRoomQueue(room.id).length > 0)

  // Fewer rooms on screen means each one should read from further away — a
  // single open room should dominate the whole screen, two should split it
  // evenly, and from three up it falls back to a normal grid.
  const roomCount = visibleRooms.length
  const tier =
    roomCount === 1
      ? {
          grid: 'grid-cols-1',
          fillHeight: true,
          cardPad: 'p-12 sm:p-20',
          roomName: 'text-[28px] sm:text-[40px] font-semibold',
          tokenPad: 'px-14 py-6 sm:px-20 sm:py-9',
          tokenText: 'text-[52px] sm:text-[80px] lg:text-[96px]',
          message: 'text-[20px] sm:text-[26px]',
          upNextRowPad: 'px-6 py-4',
          upNextToken: 'text-[28px] sm:text-[40px] font-semibold',
        }
      : roomCount === 2
        ? {
            grid: 'grid-cols-1 sm:grid-cols-2',
            fillHeight: true,
            cardPad: 'p-10 sm:p-14',
            roomName: 'text-[24px] sm:text-[32px] font-semibold',
            tokenPad: 'px-10 py-5 sm:px-14 sm:py-6',
            tokenText: 'text-[40px] sm:text-[60px] lg:text-[68px]',
            message: 'text-[17px] sm:text-[21px]',
            upNextRowPad: 'px-5 py-3',
            upNextToken: 'text-[22px] sm:text-[30px] font-semibold',
          }
        : {
            grid: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
            fillHeight: false,
            cardPad: 'p-8 sm:p-10',
            roomName: 'font-headline-md text-headline-md',
            tokenPad: 'px-6 py-3 sm:px-8 sm:py-4',
            tokenText: 'text-[40px] sm:text-[52px]',
            message: 'text-body-lg',
            upNextRowPad: 'px-4 py-2.5',
            upNextToken: 'font-headline-md text-headline-md font-semibold',
          }

  return (
    <div className="app-canvas flex min-h-screen flex-col p-10 font-body-md">
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

      <div className={`grid gap-8 ${tier.grid} ${tier.fillHeight ? 'flex-1' : ''}`}>
        {visibleRooms.map((room) => {
          const queue = getRoomQueue(room.id)
          const serving = queue.find((v) => v.status === 'in_consultation')
          const upNext = queue.filter((v) => v.status !== 'in_consultation').slice(0, 6)

          return (
            <div
              key={room.id}
              className={
                `card-surface flex flex-col items-center text-center ${tier.cardPad} ` +
                (tier.fillHeight ? 'h-full justify-center' : '')
              }
            >
              <p className={`${tier.roomName} text-on-surface`}>{room.name}</p>
              <div className="mb-6 mt-2">
                <Badge tone={room.currentDoctorId ? 'active' : 'done'}>
                  <MIcon name="stethoscope" className="text-[13px]" />
                  {room.currentDoctorId ? getStaffName(room.currentDoctorId) : 'Unattended'}
                </Badge>
              </div>

              <p className="font-label-caps text-label-caps uppercase text-primary">Now Serving</p>
              {serving ? (
                <div className={`my-3 inline-flex max-w-[90%] items-center justify-center rounded-3xl bg-primary/10 ${tier.tokenPad}`}>
                  <p
                    className={`whitespace-nowrap font-display-stat ${tier.tokenText} font-bold leading-none tracking-wide text-primary tabular-nums`}
                  >
                    {serving.tokenNumber}
                  </p>
                </div>
              ) : room.currentDoctorId ? (
                <p className={`my-6 ${tier.message} text-on-surface-variant`}>No patient in consultation</p>
              ) : (
                <p className={`my-6 ${tier.message} text-on-surface-variant`}>
                  Room not open yet — {queue.length} waiting for a doctor
                </p>
              )}

              <div className="mt-6 w-full border-t border-outline-variant/60 pt-6">
                <p className="mb-3 font-label-caps text-label-caps uppercase text-on-surface-variant">
                  Up Next {upNext.length > 0 && `(${upNext.length})`}
                </p>
                {upNext.length === 0 ? (
                  <p className="text-body-md text-on-surface-variant">Queue clear</p>
                ) : (
                  <ul className="flex w-full flex-col gap-2">
                    {upNext.map((v, idx) => (
                      <li
                        key={v.id}
                        className={
                          `flex items-center justify-between gap-3 rounded-xl ${tier.upNextRowPad} ` +
                          (v.isEmergency ? 'bg-[#fee2e2]' : 'bg-surface-container-low')
                        }
                      >
                        <span
                          className={
                            'font-label-caps text-label-caps uppercase ' +
                            (v.isEmergency ? 'text-[#dc2626]' : 'text-on-surface-variant')
                          }
                        >
                          {idx === 0 ? 'Next' : `#${idx + 1}`}
                        </span>
                        <span
                          className={
                            `whitespace-nowrap tabular-nums ${tier.upNextToken} ` +
                            (v.isEmergency ? 'text-[#dc2626]' : 'text-on-surface')
                          }
                        >
                          {v.tokenNumber}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })}

        {visibleRooms.length === 0 && (
          <p className="text-body-lg text-on-surface-variant">
            {rooms.length === 0 ? 'No OPD rooms configured for this site.' : 'No rooms currently open.'}
          </p>
        )}
      </div>
    </div>
  )
}
