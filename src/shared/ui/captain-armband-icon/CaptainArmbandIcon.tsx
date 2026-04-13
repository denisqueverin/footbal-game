export interface CaptainArmbandIconProps {
  className?: string
  title?: string
  /** Размер viewBox-иконки в px (квадрат). */
  size?: number
}

/** Упрощённая капитанская повязка (жёлтая с полосой). */
export function CaptainArmbandIcon(props: CaptainArmbandIconProps) {
  const size = props.size ?? 20
  return (
    <svg
      className={props.className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={props.title ? undefined : true}
      role={props.title ? 'img' : undefined}
    >
      {props.title ? <title>{props.title}</title> : null}
      <path
        d="M5 7.5C5 6.12 6.12 5 7.5 5h9C17.88 5 19 6.12 19 7.5v9c0 1.38-1.12 2.5-2.5 2.5h-9C6.12 19 5 17.88 5 16.5v-9Z"
        fill="#E8C547"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1"
      />
      <path
        d="M8 7h8v3H8V7Zm0 4h8v2H8v-2Zm0 3h8v3H8v-3Z"
        fill="rgba(20,12,4,0.55)"
      />
    </svg>
  )
}
