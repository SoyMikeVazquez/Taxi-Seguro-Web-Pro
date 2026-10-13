"use client";

import { useEffect, useRef } from "react";

export default function VisitorTracker() {
    const tracked = useRef(false);

    useEffect(() => {
        // Prevent double tracking in strict mode
        if (tracked.current) return;
        tracked.current = true;

        const trackVisitor = async () => {
            try {
                await fetch("/api/track-visitor", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
            } catch (error) {
                // Silently fail to avoid breaking the user experience
                console.error("Vistor tracking failed", error);
            }
        };

        // Delay slightly so it doesn't block critical rendering
        const timer = setTimeout(() => {
            trackVisitor();
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return null; // Silent component
}
