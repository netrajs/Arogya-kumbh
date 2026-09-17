import { Topbar } from '../components/layout/Topbar'
import { GlassCard } from '../components/ui/GlassCard'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { useClinic } from '../lib/store'
import { useActiveUser } from '../lib/activeUser'

export function Doctors() {
  const { state, doctors } = useClinic()
  const { site } = useActiveUser()

  const siteDoctors = site ? doctors.filter((d) => d.siteId === site.id) : doctors

  return (
    <div>
      <Topbar title="Doctors" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {siteDoctors.map((doc) => {
          const room = state.rooms.find((r) => r.currentDoctorId === doc.id)
          return (
            <GlassCard key={doc.id} className="flex items-center gap-4 p-5">
              <Avatar name={doc.name} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#211c37]">{doc.name}</p>
                {room ? (
                  <Badge tone="ok">On duty · {room.name}</Badge>
                ) : (
                  <Badge tone="idle">Off duty</Badge>
                )}
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
