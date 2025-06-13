// components/TowerMap.tsx
import React, { useEffect, useRef } from 'react';
import siteMap from '../assets/site-map.svg';

interface Props {
  onTowerClick: (towerId: string) => void;
}

const TowerMap: React.FC<Props> = ({ onTowerClick }) => {
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(siteMap)
      .then((res) => res.text())
      .then((svgText) => {
        if (svgContainerRef.current) {
          svgContainerRef.current.innerHTML = svgText;

          const towers = svgContainerRef.current.querySelectorAll('[id^="tower-"]');
          towers.forEach((el) => {
            el.setAttribute('style', 'cursor: pointer;');
            el.addEventListener('click', () => onTowerClick(el.id));
          });
        }
      });
  }, [onTowerClick]);

  return (
    <div ref={svgContainerRef} className="svg-container" style={{ border: '1px solid #aaa' }} />
  );
};

export default TowerMap;
