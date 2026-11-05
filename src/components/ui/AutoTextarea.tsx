"use client";

import { forwardRef, useCallback, useLayoutEffect, useRef } from "react";

/** A textarea that grows with its content instead of scrolling. */
const AutoTextarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function AutoTextarea({ className = "", value, ...rest }, outer) {
    const inner = useRef<HTMLTextAreaElement | null>(null);
    const setRefs = useCallback(
      (el: HTMLTextAreaElement | null) => {
        inner.current = el;
        if (typeof outer === "function") outer(el);
        else if (outer) outer.current = el;
      },
      [outer],
    );

    // Measure on every change and whenever the width changes the wrapping.
    useLayoutEffect(() => {
      const el = inner.current;
      if (!el) return;
      const fit = () => {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      };
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(el);
      return () => ro.disconnect();
    }, [value]);

    return <textarea ref={setRefs} value={value} rows={1} className={`resize-none overflow-hidden ${className}`} {...rest} />;
  },
);

export default AutoTextarea;
