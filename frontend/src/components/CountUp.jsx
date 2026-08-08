import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CountUp({
  to = 0,
  from = 0,
  duration = 0.8,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
  style = {}
}) {
  const nodeRef = useRef(null);
  const prevVal = useRef(from);

  useEffect(() => {
    const obj = { val: prevVal.current };
    
    const tween = gsap.to(obj, {
      val: to,
      duration: duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (nodeRef.current) {
          nodeRef.current.textContent = `${prefix}${obj.val.toFixed(decimals)}${suffix}`;
        }
      },
      onComplete: () => {
        prevVal.current = to;
      }
    });

    return () => tween.kill();
  }, [to, duration, decimals, prefix, suffix]);

  return (
    <span ref={nodeRef} className={className} style={{ fontFamily: 'var(--font-mono)', ...style }}>
      {prefix}{to.toFixed(decimals)}{suffix}
    </span>
  );
}
