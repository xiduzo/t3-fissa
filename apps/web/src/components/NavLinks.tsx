import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { useTheme } from "~/providers/ThemeProvider";

const links = [
  ["Features", "/#features"],
  ["Join a Fissa", "/#join-a-fissa"],
  ["FAQs", "/#faqs"],
] as const;

export function NavLinks() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const { theme } = useTheme();

  return links.map(([label, href], index) => (
    <a
      key={label}
      href={href}
      style={{ color: theme[100] }}
      className="relative -mx-3 -my-2 rounded-lg px-3 py-2 text-sm transition-colors delay-150 hover:delay-0"
      onMouseEnter={() => {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        setHoveredIndex(index);
      }}
      onMouseLeave={() => {
        timeoutRef.current = window.setTimeout(() => setHoveredIndex(null), 200);
      }}
    >
      <AnimatePresence>
        {hoveredIndex === index && (
          <motion.span
            className="absolute inset-0 rounded-lg border"
            layoutId="hoverBackground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.15 } }}
            style={{ borderColor: theme[100] }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10">{label}</span>
    </a>
  ));
}
