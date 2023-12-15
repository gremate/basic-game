import { useEffect, useRef, useState } from 'react';

export default function useRunLoop() {
    const [, forceUpdate] = useState<Record<PropertyKey, never>>({});
    const timestampRef = useRef(performance.now());
    const prevTimestampRef = useRef(timestampRef.current);

    useEffect(() => {
        function callback(newTimestamp: number) {
            prevTimestampRef.current = timestampRef.current;
            timestampRef.current = newTimestamp;

            forceUpdate({});
            requestAnimationFrameId = window.requestAnimationFrame(callback);
        }

        let requestAnimationFrameId = window.requestAnimationFrame(callback);

        return () => window.cancelAnimationFrame(requestAnimationFrameId);
    }, []);

    return {
        timestamp: timestampRef.current,
        prevTimestamp: prevTimestampRef.current
    };
}
