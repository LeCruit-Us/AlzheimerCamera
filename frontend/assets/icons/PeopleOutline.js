import * as React from "react"
import Svg, { Path } from "react-native-svg"

function PeopleOutline({size = 24, color="currentColor", ...props}) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke={color}
      className="size-6"
      {...props}
    >
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21C7.043 21 4.862 20.355 3 19.234z"
      />
    </Svg>
  )
}

export default PeopleOutline
