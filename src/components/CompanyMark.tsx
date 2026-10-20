import Image from "next/image";

export function CompanyMark({
  src,
  className,
  width = 160,
  height = 40,
}: {
  src: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return (
      // Employer uploads live on Supabase storage.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" width={width} height={height} className={className} />
    );
  }

  return (
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      className={className}
    />
  );
}
