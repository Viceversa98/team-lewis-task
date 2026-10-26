export type Reading = {
  id: number;
  score: number;
  createdAt: string;
};

type EarlierReadingsProps = {
  readings: Reading[];
};

const VISIBLE_READINGS = 4;

const formatReading = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const EarlierReadings = ({ readings }: EarlierReadingsProps) => {
  if (readings.length === 0) return null;
  const shown = readings.slice(0, VISIBLE_READINGS);

  return (
    <section aria-labelledby="earlier-readings" className="min-h-0">
      <h2 id="earlier-readings" className="text-sm text-studio-muted">
        Earlier readings
      </h2>
      <ul className="mt-3 grid grid-cols-4 gap-2">
        {shown.map((reading, index) => (
          <li
            key={reading.id}
            className={`relative ${index >= 2 ? "hidden lg:block" : "block"}`}
          >
            <img
              src={`/bench/file/${reading.id}`}
              alt=""
              loading="lazy"
              className="aspect-[3/4] w-full bg-well object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 bg-well/80 px-1.5 py-1">
              <time dateTime={reading.createdAt} className="truncate text-[11px] text-studio-muted">
                {formatReading(reading.createdAt)}
              </time>
              <span className="font-display text-sm text-glow">{reading.score}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
