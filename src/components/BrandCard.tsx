export default function BrandCard({
  name,
  color,
  logo,
  delay = 0,
  ink = false,
  onClick,
}: {
  name: string
  color: string
  logo?: string
  delay?: number
  ink?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`svc live${ink ? ' ink' : ''}`}
      style={{ background: color, ['--d' as string]: `${delay}s` }}
      onClick={onClick}
    >
      {logo ? <img src={logo} alt={name} /> : <b>{name}</b>}
    </button>
  )
}

export function ArtLogo({
  name,
  color,
  logo,
  art,
  kicker,
  delay = 0,
  onClick,
}: {
  name: string
  color: string
  logo?: string
  art?: string
  kicker?: string
  delay?: number
  onClick: () => void
}) {
  return (
    <div className="plate art-plate">
      <button
        type="button"
        className="art-card live"
        style={{ background: color, ['--d' as string]: `${delay}s` }}
        onClick={onClick}
      >
        {art ? <img className="art-bg" src={art} alt="" /> : null}
        {logo ? (
          <img className="art-logo" src={logo} alt="" />
        ) : (
          <b className="art-word">{kicker ? <small>{kicker}</small> : null}{name}</b>
        )}
      </button>
      <span className="plate-cap">{name}</span>
    </div>
  )
}
