import * as React from "react"
import Svg, { Path } from "react-native-svg"

function ReminderOutline({size = 24, color="currentColor", ...props}) {
  return (
    <Svg
    width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke={color}
      className="size-6"
      {...props}
    >
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </Svg>
  )
}

export default ReminderOutline
