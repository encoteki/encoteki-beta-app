import Link from 'next/link'

interface Breadcrumbs {
  index: number
  page: string
  link: string
}

export default function Breadcrumbs({ items }: { items: Breadcrumbs[] }) {
  return (
    <div className="flex gap-2">
      {items.map((item, index) => {
        return (
          <div key={index} className="flex gap-2 text-base md:text-lg">
            {index === items.length - 1 ? (
              <span className={'text-neutral-10'}>{item.page}</span>
            ) : (
              <Link href={item.link}>
                <span
                  className={
                    'text-neutral-30 transition-colors duration-300 hover:text-neutral-10'
                  }
                >
                  {item.page}
                </span>
              </Link>
            )}

            {index != items.length - 1 && <p className="text-neutral-30">/</p>}
          </div>
        )
      })}
    </div>
  )
}
