import React, { useRef, useEffect } from "react"
import useOutsideClick from "../hooks/useOutsideClick"
import styles from "./Modal.module.css"

const Modal: React.FC<{
  children: React.ReactNode
  id: string
  open: boolean
  onClose: () => void
}> = ({ id, children, open, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useOutsideClick(contentRef, onClose)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (open) {
      dialog.showModal()
      dialog.dataset.open = ""
    } else {
      // Close modal after transition ends
      delete dialog.dataset.open
      const handler = () => dialog.close()
      const inner = dialog.children[0] as HTMLElement
      inner.addEventListener("transitionend", handler)
      return () => inner.removeEventListener("transitionend", handler)
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    // Set modal state to close on ESC
    const _onClose = (e: Event) => {
      e.preventDefault()
      onClose()
    }

    dialog.addEventListener("close", _onClose)
    dialog.addEventListener("cancel", _onClose)

    return () => {
      dialog.removeEventListener("close", _onClose)
      dialog.removeEventListener("cancel", _onClose)
    }
  }, [onClose])

  if (!open) {
    return null
  }

  return (
    <dialog ref={dialogRef} id={id} className={styles.dialog}>
      <div className={styles.overlay}>
        <div className={styles.container}>
          <div className={styles.content} ref={contentRef}>
            <div className={styles.children}>{children}</div>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default Modal
