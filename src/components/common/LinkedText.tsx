import React from "react";
import { ExternalLink } from "lucide-react";

interface LinkedTextProps {
  text: string;
  className?: string;
}

export function LinkedText({ text, className = "" }: LinkedTextProps) {
  if (!text) return null;

  // Match Z10-XXXXX or PR #XXXX or pull/XXXX
  const regex = /(Z10-\d+)|(PR\s*#\d+)|(?:pull\/)(\d+)/gi;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];

    // Jira Ticket match
    if (match[1]) {
      const ticketKey = match[1].toUpperCase();
      elements.push(
        <a
          key={`jira-${ticketKey}-${match.index}`}
          href={`https://amla.atlassian.net/browse/${ticketKey}`}
          target="_blank"
          rel="noreferrer"
          title={`Open ${ticketKey} in Jira`}
          className="inline-flex items-center gap-1 text-blue-400 hover:text-white font-mono font-bold underline underline-offset-2 hover:bg-blue-900/40 px-1 py-0.5 rounded transition-all"
        >
          <span>{ticketKey}</span>
          <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
        </a>
      );
    }
    // GitHub PR match
    else if (match[2] || match[3]) {
      const numMatch = token.match(/\d+/);
      const prNum = numMatch ? parseInt(numMatch[0]) : null;
      if (prNum) {
        const repo =
          prNum >= 8000
            ? "znode10-admin-migration"
            : "znode-webstore10x-page-builder";
        const prUrl = `https://github.com/MRRSoft/${repo}/pull/${prNum}`;

        elements.push(
          <a
            key={`pr-${prNum}-${match.index}`}
            href={prUrl}
            target="_blank"
            rel="noreferrer"
            title={`Open PR #${prNum} (${repo}) on GitHub`}
            className="inline-flex items-center gap-1 text-emerald-300 hover:text-white font-mono font-semibold bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 px-1.5 py-0.5 rounded transition-all"
          >
            <span>PR #{prNum}</span>
            <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
          </a>
        );
      } else {
        elements.push(token);
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return <span className={className}>{elements}</span>;
}

export function renderWithLinks(text: string) {
  return <LinkedText text={text} />;
}
