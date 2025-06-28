import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle, HelpCircle, Info, LightbulbIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const calloutVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        info: "border-blue-500/20 bg-blue-500/10 text-blue-700 [&>svg]:text-blue-500",
        tip: "border-green-500/20 bg-green-500/10 text-green-700 [&>svg]:text-green-500",
        warn: "border-yellow-500/20 bg-yellow-500/10 text-yellow-700 [&>svg]:text-yellow-500",
        beginner: "border-purple-500/20 bg-purple-500/10 text-purple-700 [&>svg]:text-purple-500",
        note: "border-gray-500/20 bg-gray-500/10 text-gray-700 [&>svg]:text-gray-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const calloutIconMap = {
  default: Info,
  info: Info,
  tip: LightbulbIcon,
  warn: AlertCircle,
  beginner: HelpCircle,
  note: Info,
  success: CheckCircle
}

export interface CalloutProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof calloutVariants> {
      icon?: keyof typeof calloutIconMap
      title?: string
      dismissable?: boolean
    }

export function Callout({
  className,
  variant,
  icon,
  title,
  children,
  dismissable = false,
  ...props
}: CalloutProps) {
  const [dismissed, setDismissed] = React.useState(false)
  
  // If a specific icon is provided, use it, otherwise use the icon mapped to the variant
  const IconComponent = icon ? calloutIconMap[icon as keyof typeof calloutIconMap] : variant ? calloutIconMap[variant as keyof typeof calloutIconMap] : Info

  if (dismissable && dismissed) {
    return null
  }
  
  return (
    <div
      className={cn(calloutVariants({ variant }), className)}
      {...props}
    >
      <IconComponent className="h-4 w-4" />
      <div className="flex flex-col space-y-1">
        {title && <h4 className="font-medium">{title}</h4>}
        <div className="text-sm">{children}</div>
      </div>
      {dismissable && (
        <button 
          onClick={() => setDismissed(true)} 
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          &times;
        </button>
      )}
    </div>
  )
}