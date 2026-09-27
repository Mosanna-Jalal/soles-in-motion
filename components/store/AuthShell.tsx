import Image from "next/image";
import { ImageReveal, SplitText } from "@/components/motion/primitives";

export default function AuthShell({ title, subtitle, image, children }: { title: string; subtitle: string; image?: string; children: React.ReactNode }) {
  return (
    <div className="container-x grid min-h-screen items-center gap-12 pb-10 pt-32 lg:grid-cols-2">
      <ImageReveal className="relative hidden h-[78vh] rounded-[32px] lg:block">
        {image && <Image src={image} alt="" fill priority sizes="50vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="display text-6xl leading-[0.9]">
            Every step
            <br />
            <span className="text-volt">counts.</span>
          </p>
        </div>
      </ImageReveal>
      <div className="flex flex-col items-center lg:items-start lg:pl-10">
        <div className="mb-10 w-full max-w-md">
          <SplitText as="h1" trigger="mount" text={title} className="display block text-6xl sm:text-7xl" />
          <p className="mt-3 text-mist">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
