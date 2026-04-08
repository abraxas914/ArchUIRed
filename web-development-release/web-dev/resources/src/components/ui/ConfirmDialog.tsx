import s from './ConfirmDialog.module.css'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm(): void
  onCancel(): void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: Props) {
  return (
    <div className={s.overlay} onClick={onCancel}>
      <div className={s.dialog} onClick={e => e.stopPropagation()}>
        <h2 className={s.title}>{title}</h2>
        <p className={s.message}>{message}</p>
        <div className={s.actions}>
          <button className={s.btn} onClick={onCancel}>Cancel</button>
          <button className={`${s.btn} ${danger ? s.btnDanger : ''}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
