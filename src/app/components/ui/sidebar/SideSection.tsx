'use client';

import { useState, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';

type SideSectionProps = {
  title: string;
  icon: string;
  children: React.ReactNode;
};

export default function SideSection({ title, icon, children }: SideSectionProps) {
  const [isActive, setIsActive] = useState(true);
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const ref = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      setHeight(ref.current.scrollHeight);
    }
  }, [children]);

  const toggle = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('ul') === ref.current) return;
    setIsActive(!isActive);
  };

  return (
    <li>
      <a
        onClick={toggle}
        className={`uc-navbar-side_label ${isActive ? 'active' : ''}`}
      >
        <span className="h5">
          <i className="uc-icon uc-icon--main pb-4">{icon}</i>
          {title}
        </span>
        <motion.i
          className="uc-icon"
          animate={{ rotate: isActive ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          style={{ display: 'inline-block' }}
        >
          keyboard_arrow_right
        </motion.i>
      </a>

      <motion.div
        initial={false}
        animate={{ height: isActive ? height : 0, opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ overflowY: 'hidden' }}
      >
        <ul ref={ref} className="uc-navbar-side" style={{ padding: '10px 4px' }}>
          {children}
        </ul>
      </motion.div>
    </li>
  );
}
