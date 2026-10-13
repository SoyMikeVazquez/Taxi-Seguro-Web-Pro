"use client";

import Image from "next/image";

const brands = [
    "45.png", "47.png", "anden.png", "arabela.png", "aries.png", "arnecom.png",
    "arth.png", "arxy.png", "aztra.png", "banor.png", "bbva.png", "bio.png",
    "busch.png", "cat.png", "ceme.png", "cemex.png", "cfe.png", "cie.png",
    "corpo nu.png", "csd.png", "csdcsdd.png", "dcd.png", "enmex.png", "enviflo.png",
    "farma.png", "fin.png", "for.png", "gab.png", "gone.png", "her.png",
    "immsa.png", "imss.png", "inver.png", "kiik.png", "kn.png", "lapp.png",
    "liver.png", "logicom.png", "lozen.png", "m.png", "nidec.png", "noe.png",
    "novo nordi.png", "polar.png", "prada.png", "sent.png", "swiss.png", "tel.png",
    "telcel.png", "telmex.png", "ter.png", "trans.png", "ttec.png", "uanl.png"
];

export default function TrustBar() {
    return (
        <section className="bg-[#111] py-1 overflow-hidden border-t border-gray-800">
            <div className="relative w-full flex overflow-hidden">
                {/* First marquee set */}
                <div className="flex w-max animate-marquee whitespace-nowrap">
                    {brands.map((brand, index) => (
                        <div
                            key={`b1-${brand}-${index}`}
                            className="inline-flex items-center justify-center mx-6 md:mx-8 w-[150px] md:w-[180px] relative h-[80px]"
                        >
                            <Image
                                src={`/marcas/${brand}`}
                                alt={brand.replace(".png", "")}
                                fill
                                className="object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
                                sizes="(max-width: 768px) 150px, 180px"
                            />
                        </div>
                    ))}
                </div>

                {/* Second marquee set (duplicate) for seamless loop */}
                <div className="flex w-max animate-marquee whitespace-nowrap" aria-hidden="true">
                    {brands.map((brand, index) => (
                        <div
                            key={`b2-${brand}-${index}`}
                            className="inline-flex items-center justify-center mx-6 md:mx-8 w-[150px] md:w-[180px] relative h-[80px]"
                        >
                            <Image
                                src={`/marcas/${brand}`}
                                alt={brand.replace(".png", "")}
                                fill
                                className="object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
                                sizes="(max-width: 768px) 150px, 180px"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
