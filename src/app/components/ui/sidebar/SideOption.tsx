'use client';

import { CSSProperties, useEffect, useState } from 'react';
import Link from 'next/link';
import MapUtils from '@/utils/MapUtils';

type SideOptionProps = {
  title: string;
  placeId?: number;
  routeId?: number;
  style?: CSSProperties;
  href?: string;
  onClick?: () => void;
  target?: '_self' | '_blank';
  prefetch?: boolean;
};

export default function SideOption({
  title,
  routeId,
  placeId,
  href,
  onClick,
}: SideOptionProps) {
  const [isActive, setIsActive] = useState(false);
  const [iconInfo, setIconInfo] = useState<{ icon: string; color: string } | null>(null);

  useEffect(() => {
    if (placeId !== undefined) {
      MapUtils.initPlaceIcons().then(() => {
        setIconInfo(MapUtils.idToIcon(placeId));
      });
    }
  }, [placeId]);

  const handleFocus = () => setIsActive(true);
  const handleBlur = () => setIsActive(false);

  const iconColor = iconInfo?.color ?? (routeId ? MapUtils.routeIdToColor(`${routeId}`) : '');
  const iconName = iconInfo?.icon ?? (routeId ? MapUtils.routeIdToIcon(routeId) : 'keyboard_arrow_right');

  return (
    <li className="" onClick={onClick ? onClick : (e) => e.preventDefault()}>
      <Link
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={isActive ? 'active' : ''}
        href={href ?? ''}
        aria-label={title}
        style={{
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <span>{title}</span>
        <i className="uc-icon" style={{ color: iconColor }}>{iconName}</i>
      </Link>
    </li>
  );
}
