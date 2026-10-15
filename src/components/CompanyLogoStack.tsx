import Image from "next/image";

const OPERATORS = [
  {
    id: "constellation",
    src: "/company-logos/constellation.png",
    fit: "contain",
  },
  {
    id: "duke",
    src: "/company-logos/duke.png",
    fit: "contain",
  },
  {
    id: "dominion",
    src: "/company-logos/dominion.png",
    fit: "contain",
  },
  {
    id: "nextera",
    src: "/company-logos/nextera.png",
    fit: "contain",
  },
  {
    id: "tva",
    src: "/company-logos/tva.png",
    fit: "cover",
  },
] as const;

export function CompanyLogoStack() {
  return (
    <span className="flex items-center" aria-hidden="true">
      {OPERATORS.map((operator, index) => (
        <span
          key={operator.id}
          className="relative -ml-2.5 size-8 shrink-0 overflow-hidden rounded-full border-2 border-canvas bg-raised first:ml-0"
          style={{ zIndex: OPERATORS.length - index }}
        >
          <Image
            src={operator.src}
            alt=""
            width={64}
            height={64}
            className={
              operator.fit === "cover"
                ? "size-full object-cover"
                : "size-full object-contain"
            }
          />
        </span>
      ))}
    </span>
  );
}
