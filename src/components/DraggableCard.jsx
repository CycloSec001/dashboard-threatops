import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/**
 * DraggableCard
 * Wraps any card with @dnd-kit sortable drag behaviour.
 * Children receive { handleProps, isDragging } via render props
 * so the grip icon can be the only drag activator.
 */
export default function DraggableCard({ id, children, className = '', style = {} }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id })

  const combinedStyle = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    ...style,
  }

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      className={[
        className,
        isDragging ? 'dnd-dragging' : '',
        isOver && !isDragging ? 'dnd-over' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children({
        handleProps: {
          ref: setActivatorNodeRef,
          ...attributes,
          ...listeners,
        },
        isDragging,
      })}
    </div>
  )
}
