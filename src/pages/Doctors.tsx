import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
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
      <PageHeader title="Doctors" description={<>Daiko Clinic · {site?.name}</>} />

      <div className="grid gap-gutter sm:grid-cols-2 xl:grid-cols-3">
        {siteDoctors.map((doc) => {
          const room = state.rooms.find((r) => r.currentDoctorId === doc.id)
          return (
            <Card key={doc.id} className="flex items-center gap-4">
              <Avatar name={doc.name} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-headline-md text-headline-md text-on-surface">{doc.name}</p>
                <div className="mt-1.5">
                  {room ? <Badge tone="ok">On duty · {room.name}</Badge> : <Badge tone="idle">Off duty</Badge>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
