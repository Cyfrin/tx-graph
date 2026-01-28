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
    <dialog ref={dialogRef} id={id} className="group">
      <div className="fixed inset-0 z-50 bg-[color:var(--bg-modal-overlay)] p-4 opacity-0 transition-all group-data-open:opacity-100">
        <div className="flex min-h-full flex-col items-center justify-center p-4 sm:p-0 scale-75 transition-all group-data-open:scale-100">
          <div
            className="flex flex-col overflow-hidden rounded-lg bg-[color:var(--bg-modal)] px-4 pb-4 pt-5 text-[color:var(--color-1)] shadow-xl sm:w-full sm:max-w-lg"
            ref={contentRef}
          >
            {children}
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default Modal
