import { useEffect } from "react"

export default function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  onClickOutside: (e: MouseEvent) => void,
) {
  useEffect(() => {
    if (!ref.current) {
      return
    }

    const onMouseDown = (e: MouseEvent) => {
      if (
        ref.current &&
        e.target instanceof HTMLElement &&
        !ref.current.contains(e.target)
      ) {
        onClickOutside(e)
      }
    }

    document.addEventListener("mousedown", onMouseDown)

    return () => {
      document.removeEventListener("mousedown", onMouseDown)
    }
  }, [ref, onClickOutside])
}
