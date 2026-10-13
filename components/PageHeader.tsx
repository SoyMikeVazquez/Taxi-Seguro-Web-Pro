"use client";

import Image from "next/image";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    backgroundImage: string;
}

export default function PageHeader({ title, subtitle, backgroundImage }: PageHeaderProps) {
    return (
        <section className="relative h-[300px] md:h-[400px] flex items-center justify-center text-white overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={backgroundImage}
                    alt={title}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Content */}
            <div className="container mx-auto relative z-10 text-center px-4">
                <h1 className="text-4xl md:text-5xl font-bold mb-4" data-aos="fade-up">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-lg md:text-xl font-medium opacity-90" data-aos="fade-up" data-aos-delay="100">
                        {subtitle}
                    </p>
                )}
            </div>
        </section>
    );
}
