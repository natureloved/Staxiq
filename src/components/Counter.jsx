import React, { useState, useEffect } from 'react';

// Animated Counter Component that smoothly counts from 0 to target value on mount
export default function Counter({ value, decimals = 2, duration = 1500, prefix = "", suffix = "" }) {
    const [count, setCount] = useState(0);

    const safeValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value);
    const target = isNaN(safeValue) ? 0 : safeValue;

    useEffect(() => {
        let startTime = null;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Easing function for smooth deceleration
            const easeOutQuart = 1 - Math.pow(1 - percentage, 4);

            setCount(target * easeOutQuart);

            if (percentage < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(target);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration]);

    // Format final output
    const isInteger = decimals === 0 || (target % 1 === 0 && target !== 0);
    const displayValue = count.toLocaleString(undefined, {
        minimumFractionDigits: isInteger ? 0 : decimals,
        maximumFractionDigits: decimals
    });

    return (
        <span>
            {prefix}{displayValue}{suffix}
        </span>
    );
}
