import { useEffect, useState, useRef } from 'react';

interface UseIntersectionObserverProps {
    threshold?: number;
    root?: Element | null;
    rootMargin?: string;
    freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
}: UseIntersectionObserverProps = {}) {
    const [entry, setEntry] = useState<IntersectionObserverEntry>();
    const [frozen, setFrozen] = useState(false);
    const node = useRef<Element | null>(null);

    const frozenRef = useRef(frozen);
    frozenRef.current = frozen;

    const updateEntry = ([entry]: IntersectionObserverEntry[]) => {
        setEntry(entry);
        if (freezeOnceVisible && entry.isIntersecting) {
            setFrozen(true);
        }
    };

    useEffect(() => {
        const element = node.current;
        const hasIOSupport = !!window.IntersectionObserver;

        if (!hasIOSupport || frozen || !element) return;

        const observerParams = { threshold, root, rootMargin };
        const observer = new IntersectionObserver(updateEntry, observerParams);

        observer.observe(element);

        return () => observer.disconnect();
    }, [threshold, root, rootMargin, frozen]);

    return [node, entry?.isIntersecting ?? false] as const;
}
