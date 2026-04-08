import { useCanvasStore } from '../../store/canvas'
import s from './Breadcrumb.module.css'

export function Breadcrumb() {
  const breadcrumb = useCanvasStore(s => s.breadcrumb)
  const navigate   = useCanvasStore(s => s.navigate)

  return (
    <nav className={s.nav} aria-label="Breadcrumb">
      {breadcrumb.map((crumb, i) => {
        const isLast = i === breadcrumb.length - 1
        return (
          <div key={crumb.path} className={s.crumb}>
            {i > 0 && <span className={s.sep}>›</span>}
            <button
              className={`${s.btn} ${isLast ? s.btnActive : ''}`}
              onClick={() => !isLast && navigate(crumb.path)}
              disabled={isLast}
              aria-current={isLast ? 'page' : undefined}
            >
              {crumb.name}
            </button>
          </div>
        )
      })}
    </nav>
  )
}
