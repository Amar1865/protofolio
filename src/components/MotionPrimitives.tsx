import { animate, motion, useMotionValue } from 'motion/react';
import React, { useEffect, useState } from 'react';

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const FadeSlideIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedHeadingBox: React.FC<{
  kicker: string;
  title: string;
  subtitle?: string;
  className?: string;
}> = ({ kicker, title, subtitle, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2, transition: { duration: 0.18, ease: EASE_OUT_EXPO } }}
      transition={{ duration: 0.34, ease: EASE_OUT_EXPO }}
      className={`bg-slate-50/80 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-3 hover:border-emerald-300/80 transition-colors ${className}`}
    >
      <motion.p
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, delay: 0.06, ease: EASE_OUT_EXPO }}
        className="text-xs font-semibold text-emerald-700"
      >
        {kicker}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.1, ease: EASE_OUT_EXPO }}
        className="font-display text-3xl sm:text-4xl font-bold text-[#0B1F3A] leading-tight"
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.14, ease: EASE_OUT_EXPO }}
          className="text-base text-slate-600 leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
};

export const ScrollReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.38, delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const InteractivePanel: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      whileHover={{ y: -3, transition: { duration: 0.18, ease: EASE_OUT_EXPO } }}
      transition={{ duration: 0.32, delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedNumber: React.FC<{
  value: number;
  formatter: (val: number) => string;
  className?: string;
}> = ({ value, formatter, className = '' }) => {
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState(() => formatter(value));

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 0.55,
      ease: EASE_OUT_EXPO,
      onUpdate: (latest) => {
        setDisplay(formatter(latest));
      },
    });
    return () => controls.stop();
  }, [value, formatter, motionVal]);

  return <span className={className}>{display}</span>;
};
