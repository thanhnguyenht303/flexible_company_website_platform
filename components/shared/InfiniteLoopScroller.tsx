"use client";

import { Children, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import type { BuilderScrollDirection, BuilderScrollMode } from "@/modules/page-builder/page-builder.types";

type InfiniteLoopScrollerProps = {
  children: React.ReactNode;
  direction?: BuilderScrollDirection;
  mode?: BuilderScrollMode;
  autoScroll?: boolean;
  showArrows?: boolean;
  speed?: number;
};

const loopCopies = 6;
const overflowTolerance = 2;

export function InfiniteLoopScroller({
  children,
  direction = "horizontal",
  mode = "none",
  autoScroll = false,
  showArrows,
  speed = 40
}: InfiniteLoopScrollerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const firstSetRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const offsetRef = useRef(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [metrics, setMetrics] = useState({ offsets: [0], itemStep: 0, maxOffset: 0, loopSize: 0, viewportSize: 0, hasOverflow: false });
  const items = useMemo(() => Children.toArray(children).filter(Boolean), [children]);
  const isHorizontal = direction === "horizontal";
  const isInfinite = mode === "infinite";
  const isCarousel = mode === "normal";
  const normalOffset = Math.min(currentOffset, metrics.maxOffset);
  const arrowsEnabled = isCarousel || (showArrows ?? true);
  const arrowsVisible = isCarousel && metrics.hasOverflow && arrowsEnabled;
  const canMovePrevious = normalOffset > overflowTolerance;
  const canMoveNext = normalOffset < metrics.maxOffset - overflowTolerance;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  useLayoutEffect(() => {
    function measure() {
      const viewport = viewportRef.current;
      const firstSet = firstSetRef.current;
      if (!viewport || !firstSet || !items.length) {
        setMetrics({ offsets: [0], itemStep: 0, maxOffset: 0, loopSize: 0, viewportSize: 0, hasOverflow: false });
        return;
      }

      const offsets = items.map((_, index) => {
        const item = itemRefs.current[index];
        return item ? (isHorizontal ? item.offsetLeft : item.offsetTop) : 0;
      });
      const lastItem = itemRefs.current[items.length - 1] ?? null;
      const viewportSize = getViewportInnerSize(viewport, isHorizontal);
      const setSize = isHorizontal ? firstSet.scrollWidth : firstSet.scrollHeight;
      const contentSize = lastItem
        ? (isHorizontal ? lastItem.offsetLeft + lastItem.offsetWidth : lastItem.offsetTop + lastItem.offsetHeight)
        : setSize;
      const firstItem = itemRefs.current[0] ?? null;
      const firstItemSize = firstItem ? (isHorizontal ? firstItem.offsetWidth : firstItem.offsetHeight) : 0;
      const measuredStep = offsets.length > 1 ? offsets[1] - offsets[0] : firstItemSize;
      const maxOffset = Math.max(0, contentSize - viewportSize);

      setMetrics({
        offsets: offsets.length ? offsets : [0],
        itemStep: Math.max(0, measuredStep),
        maxOffset,
        loopSize: setSize,
        viewportSize,
        hasOverflow: contentSize > viewportSize + overflowTolerance
      });
      setCurrentOffset((offset) => clamp(offset, 0, maxOffset));
    }

    measure();
    const resizeObserver = new ResizeObserver(measure);
    if (viewportRef.current) resizeObserver.observe(viewportRef.current);
    if (firstSetRef.current) resizeObserver.observe(firstSetRef.current);
    if (trackRef.current) resizeObserver.observe(trackRef.current);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isHorizontal, items, mode]);

  useEffect(() => {
    if (!metrics.hasOverflow) setCurrentOffset(0);
  }, [metrics.hasOverflow]);

  useEffect(() => {
    if (!isInfinite || prefersReducedMotion) return;
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    let lastTime = performance.now();
    offsetRef.current = 0;

    function tick(time: number) {
      if (!track) return;
      const loopSize = metrics.loopSize;
      const effectiveSpeed = autoScroll || isInfinite ? speed : 0;
      const delta = loopSize > 0 ? ((time - lastTime) / 1000) * Math.max(0, effectiveSpeed) : 0;
      offsetRef.current = loopSize > 0 ? (offsetRef.current + delta) % loopSize : 0;
      track.style.transform = getTransform(direction, offsetRef.current);
      lastTime = time;
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoScroll, direction, isInfinite, metrics.loopSize, prefersReducedMotion, speed]);

  const transform = isInfinite ? undefined : getTransform(direction, normalOffset);

  function moveBy(step: number) {
    const itemStep = metrics.itemStep || metrics.maxOffset;
    setCurrentOffset((offset) => clamp(offset + step * itemStep, 0, metrics.maxOffset));
  }

  return (
    <div
      className={`block-infinite-scroll block-infinite-scroll--${direction} block-infinite-scroll--${mode}`}
      data-scroll-mode={mode}
      data-has-overflow={metrics.hasOverflow ? "true" : "false"}
      data-item-count={items.length}
      data-viewport-size={Math.round(metrics.viewportSize)}
      data-track-size={Math.round(metrics.loopSize)}
      data-current-offset={Math.round(normalOffset)}
      data-max-offset={Math.round(metrics.maxOffset)}
      data-item-step={Math.round(metrics.itemStep)}
    >
      <div ref={viewportRef} className="block-infinite-scroll__viewport">
        <div ref={trackRef} className="block-infinite-scroll__track" style={{ transform }}>
          {Array.from({ length: isInfinite ? loopCopies : 1 }).map((_, copyIndex) => (
            <div
              className="block-infinite-scroll__set"
              ref={copyIndex === 0 ? firstSetRef : undefined}
              aria-hidden={copyIndex === 0 ? undefined : true}
              inert={copyIndex === 0 ? undefined : true}
              key={copyIndex}
            >
              {items.map((item, index) => (
                <div
                  className="block-infinite-scroll__item"
                  ref={copyIndex === 0 ? (element) => {
                    itemRefs.current[index] = element;
                  } : undefined}
                  key={`${copyIndex}-${index}`}
                >
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {arrowsVisible ? (
        <div className="block-carousel-arrows">
          <button
            className="block-carousel-arrow block-carousel-arrow--previous"
            type="button"
            aria-label={isHorizontal ? "Show previous item" : "Show item above"}
            disabled={!canMovePrevious}
            onClick={() => moveBy(-1)}
          >
            {isHorizontal ? <ChevronLeft size={22} aria-hidden="true" /> : <ChevronUp size={22} aria-hidden="true" />}
          </button>
          <button
            className="block-carousel-arrow block-carousel-arrow--next"
            type="button"
            aria-label={isHorizontal ? "Show next item" : "Show item below"}
            disabled={!canMoveNext}
            onClick={() => moveBy(1)}
          >
            {isHorizontal ? <ChevronRight size={22} aria-hidden="true" /> : <ChevronDown size={22} aria-hidden="true" />}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function getTransform(direction: BuilderScrollDirection, offset: number) {
  return direction === "horizontal" ? `translate3d(${-offset}px, 0, 0)` : `translate3d(0, ${-offset}px, 0)`;
}

function getViewportInnerSize(viewport: HTMLElement, isHorizontal: boolean) {
  const styles = getComputedStyle(viewport);
  if (isHorizontal) {
    return Math.max(0, viewport.clientWidth - parseFloat(styles.paddingLeft || "0") - parseFloat(styles.paddingRight || "0"));
  }

  return Math.max(0, viewport.clientHeight - parseFloat(styles.paddingTop || "0") - parseFloat(styles.paddingBottom || "0"));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
