import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarClock, FolderKanban } from 'lucide-react'
import { differenceInCalendarDays, format } from 'date-fns'
import { getAllProjects } from '../lib/db'
import type { Project } from '../lib/types'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'

export function DeadlinesPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const navigate = useNavigate()

  useEffect(() => { getAllProjects().then(setProjects) }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const active = projects.filter(p => p.status !== 'Completed')
  const withDeadline = active.filter(p => p.deadline)
  const noDeadline = active.filter(p => !p.deadline)

  const sortByDeadline = (a: Project, b: Project) =>
    new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()

  const overdue   = withDeadline.filter(p => differenceInCalendarDays(new Date(p.deadline!), today) < 0).sort(sortByDeadline)
  const thisWeek  = withDeadline.filter(p => { const d = differenceInCalendarDays(new Date(p.deadline!), today); return d >= 0 && d <= 7 }).sort(sortByDeadline)
  const thisMonth = withDeadline.filter(p => { const d = differenceInCalendarDays(new Date(p.deadline!), today); return d > 7 && d <= 30 }).sort(sortByDeadline)
  const later     = withDeadline.filter(p => differenceInCalendarDays(new Date(p.deadline!), today) > 30).sort(sortByDeadline)

  const groups = [
    { label: 'Overdue',        labelColor: 'text-red-600',   projects: overdue   },
    { label: 'Due this week',  labelColor: 'text-amber-600', projects: thisWeek  },
    { label: 'Due this month', labelColor: 'text-violet-700',  projects: thisMonth },
    { label: 'Later',          labelColor: 'text-gray-600',  projects: later     },
  ].filter(g => g.projects.length > 0)

  if (active.length === 0) {
    return (
      <div className="p-6 max-w-3xl">
        <Header count={0} />
        <EmptyState icon={CalendarClock} title="No active projects" description="Add projects with deadlines to track them here." action={{ label: 'Go to Projects', onClick: () => navigate('/projects') }} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <Header count={withDeadline.length} />

      {groups.length === 0 ? (
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-6 text-center mb-6">
          <p className="text-violet-700 font-semibold">No upcoming deadlines</p>
          <p className="text-sm text-violet-600 mt-1">Your active projects don't have due dates set yet.</p>
        </div>
      ) : (
        <div className="space-y-7">
          {groups.map(group => (
            <div key={group.label}>
              <h2 className={`text-sm font-semibold mb-3 ${group.labelColor}`}>{group.label} · {group.projects.length}</h2>
              <div className="space-y-2">
                {group.projects.map(project => (
                  <DeadlineRow key={project.id} project={project} today={today} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {noDeadline.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-400 mb-3">No deadline set · {noDeadline.length}</h2>
          <div className="space-y-2">
            {noDeadline.map(project => (
              <Link key={project.id} to="/projects" className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-700 transition-colors">
                <ProjectThumb project={project} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{project.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{project.type}</p>
                </div>
                <Badge label={project.status} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Header({ count }: { count: number }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <CalendarClock size={24} className="text-violet-600" />
        Deadlines
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {count} active project{count !== 1 ? 's' : ''} with deadlines
      </p>
    </div>
  )
}

function ProjectThumb({ project }: { project: Project }) {
  const photo = project.coverPhoto || project.progressPhotos[0]
  return (
    <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
      {photo
        ? <img src={photo} alt="" className="w-full h-full object-cover" />
        : <FolderKanban size={14} className="text-gray-300" />
      }
    </div>
  )
}

function DeadlineRow({ project, today }: { project: Project; today: Date }) {
  const deadline = new Date(project.deadline!)
  const daysLeft = differenceInCalendarDays(deadline, today)
  const isOverdue = daysLeft < 0

  const urgencyText =
    isOverdue          ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue`
    : daysLeft === 0   ? 'Due today'
    : daysLeft === 1   ? 'Due tomorrow'
    :                    `${daysLeft} days left`

  const urgencyColor =
    isOverdue        ? 'text-red-600'
    : daysLeft <= 7  ? 'text-amber-600'
    :                  'text-violet-600'

  return (
    <Link to="/projects" className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-violet-200 dark:hover:border-violet-700 transition-colors">
      <ProjectThumb project={project} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{project.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">{format(deadline, 'MMM d, yyyy')}</span>
          <Badge label={project.status} />
        </div>
      </div>
      <span className={`text-xs font-semibold shrink-0 ${urgencyColor}`}>{urgencyText}</span>
    </Link>
  )
}
