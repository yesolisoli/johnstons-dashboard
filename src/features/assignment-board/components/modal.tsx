"use client";

import type { ReactNode } from "react";

export function Modal({
  title,
  children,
  footer,
  onClose,
  width = "w-96",
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  width?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className={`${width} rounded-lg bg-white shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        </div>
        <div className="border-b border-slate-200" />
        <div className="px-6 py-5">
          {children}
        </div>
        {footer && (
          <>
            <div className="border-t border-slate-200" />
            <div className="px-6 py-4">
              {footer}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
