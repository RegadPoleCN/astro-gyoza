import { getRelativeTime, getFormattedDate } from '@/utils/date'
import { useEffect, useState } from 'react'

export function RelativeDate({ date }: { date: Date }) {
  const [dateStr, setDateStr] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const relative = getRelativeTime(date)
    if (relative) {
      setDateStr(relative)
    } else {
      setDateStr(getFormattedDate(date))
    }
  }, [date])

  if (!mounted) {
    return <span>{getFormattedDate(date)}</span>
  }

  return <span>{dateStr}</span>
}
