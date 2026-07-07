'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

interface ActionsDropdownProps {
  menuId: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

const MENU_HEIGHT = 220;

export default function ActionsDropdown({
  menuId,
  isOpen,
  onToggle,
  onClose,
  children,
}: ActionsDropdownProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < MENU_HEIGHT + 16;

      setCoords({
        top: openUpward ? rect.top - MENU_HEIGHT - 8 : rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  return (
    <div className="relative" data-actions-menu={menuId}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all"
        aria-label="More actions"
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-5 w-5 text-gray-600" />
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[200]" onClick={onClose} aria-hidden="true" />
            <div
              className="fixed z-[210] w-48 bg-white rounded-xl border border-gray-100 shadow-2xl py-2"
              style={{
                top: coords.top,
                right: coords.right,
              }}
              role="menu"
            >
              {children}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
