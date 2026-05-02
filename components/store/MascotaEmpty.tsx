import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Props {
  title?: string
  message?: string
  className?: string
}

export function MascotaEmpty({
  title = 'Tu cajita está vacía. Y eso está mal.',
  message,
  className,
}: Props) {
  return (
    <div className={cn('flex flex-col items-center text-center gap-4', className)}>
      <Image
        src="/brand/mascota-crema-verde.png"
        alt="Mascota de donot."
        width={200}
        height={250}
        className="h-48 w-auto"
      />
      <h2 className="font-display text-2xl text-donot-verde">{title}</h2>
      {message && (
        <p className="text-donot-muted max-w-sm">{message}</p>
      )}
    </div>
  )
}
