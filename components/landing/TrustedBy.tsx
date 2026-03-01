
const companies = [
  "Acme Corp",
  "Globex",
  "Soylent Corp",
  "Initech",
  "Umbrella Corp",
];

export function TrustedBy() {
  return (
    <section className="py-12 border-y bg-muted/50">
      <div className="container px-4 md:px-6">
        <p className="text-center text-sm font-semibold text-muted-foreground mb-8">
          TRUSTED BY PACKAGING LEADERS
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-70">
          {companies.map((name) => (
            <div key={name} className="text-xl font-bold flex items-center gap-2">
              {/* distinct placeholder icons/styles for variety */}
              <div className="h-8 w-8 bg-current rounded-full opacity-20" />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
