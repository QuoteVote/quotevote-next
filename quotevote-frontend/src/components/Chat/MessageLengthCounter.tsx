import { cn } from "@/lib/utils";
import { MESSAGE_COUNTER_FROM, MESSAGE_MAX_LENGTH } from "@/lib/constants/messages";

/** "1,850 / 2,000" under a chat composer once a message gets close to the limit (#797). */
export function MessageLengthCounter({ length }: { length: number }) {
  if (length < MESSAGE_COUNTER_FROM) return null;
  const atLimit = length >= MESSAGE_MAX_LENGTH;
  return (
    <p
      className={cn(
        "mt-1 text-right text-xs tabular-nums",
        atLimit ? "text-destructive" : "text-muted-foreground"
      )}
      aria-live="polite"
      data-testid="message-length-counter"
    >
      {length.toLocaleString("en-US")} / {MESSAGE_MAX_LENGTH.toLocaleString("en-US")}
      {atLimit && <span className="sr-only"> characters, the most a message can have</span>}
    </p>
  );
}
