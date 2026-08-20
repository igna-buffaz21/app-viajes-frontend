import type { ChatRole } from "../chat.types";
import { MarkdownMessage } from "./MarkdownMessage";

interface MessageBubbleProps {
  role: ChatRole;
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  if (role === "usuario") {
    return (
      <div className="fv-msg-in fv-theme-transition ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm break-words text-primary-foreground sm:max-w-[80%]">
        {content}
      </div>
    );
  }

  return (
    <div className="fv-msg-in fv-theme-transition mr-auto max-w-[85%] break-words rounded-lg border border-border bg-card px-3 py-2 sm:max-w-[80%]">
      <MarkdownMessage content={content} />
    </div>
  );
}
