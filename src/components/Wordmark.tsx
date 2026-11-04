export default function Wordmark({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-display font-medium tracking-tight ${className}`}>
      normen
      <span className="ml-1.5 inline-block rounded-full bg-steel px-2 py-0.5 align-middle font-sans text-[10px] font-medium leading-none text-steel-ink">
        AI
      </span>
    </span>
  );
}
