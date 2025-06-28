import { Info } from "lucide-react"

interface InfoProps {
  children: React.ReactNode
  className?: string
}

export function InfoCard({ children, className }: InfoProps) {
  return (
    <div className={`flex items-start space-x-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 ${className}`}>
      <Info className="h-5 w-5 flex-shrink-0 text-blue-500" />
      <div className="text-sm text-blue-600">{children}</div>
    </div>
  )
}