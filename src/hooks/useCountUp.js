import { useState, useEffect, useRef } from 'react';

export function useCountUp(target, duration = 1500, decimals = 4) {
    const [count, setCount] = useState(0);
    const targetNum = parseFloat(target) || 0;
    const frameRef = useRef(null);

    useEffect(() => {
        if (targetNum === 0) {
            setCount(0);
            return;
        }

        const startTime = performance.now();
        const startValue = 0;

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function — ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (targetNum - startValue) * eased;

            setCount(current);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            }
        }

        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, [targetNum, duration]);

    return count.toFixed(decimals);
}
