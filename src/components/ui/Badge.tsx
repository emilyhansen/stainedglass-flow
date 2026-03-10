const variants: Record<string, string> = {
  // Status
  'In Stock': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  'Low': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  'Out of Stock': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
  // Pattern status
  'In Stash': 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-400',
  'Wish List': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
  'In Progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
  'Made': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  // Project status
  'Planning': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  'On Hold': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
  'Completed': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  // Priority
  'High': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
  'Medium': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  'default': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
}

interface BadgeProps { label: string; className?: string }

export function Badge({ label, className = '' }: BadgeProps) {
  const cls = variants[label] ?? variants.default
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls} ${className}`}>
      {label}
    </span>
  )
}
