import { isFinalProposal, parseFinalProposal } from "../messageParser";
import type { ChatRole } from "../chat.types";
import { MarkdownMessage } from "./MarkdownMessage";
import { ProposalCard } from "./ProposalCard";

interface MessageBubbleProps {
  role: ChatRole;
  content: string;
  onElegirPropuesta: () => void;
}

export function MessageBubble({ role, content, onElegirPropuesta }: MessageBubbleProps) {
  if (role === "usuario") {
    return (
      <div className="fv-msg-in fv-theme-transition ml-auto max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm break-words text-primary-foreground sm:max-w-[80%]">
        {content}
      </div>
    );
  }

  if (isFinalProposal(content)) {
    return (
      <div className="fv-msg-in">
        <ProposalCard proposal={parseFinalProposal(content)} onElegir={onElegirPropuesta} />
      </div>
    );
  }

  return (
    <div className="fv-msg-in fv-theme-transition mr-auto max-w-[85%] break-words rounded-lg border border-border bg-card px-3 py-2 sm:max-w-[80%]">
      <MarkdownMessage content={content} />
    </div>
  );
}
