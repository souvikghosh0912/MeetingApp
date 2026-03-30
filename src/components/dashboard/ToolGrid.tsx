"use client";

import Link from "next/link";
import { ArrowRight, Mic, FileSearch, GitBranch, CheckSquare } from "lucide-react";

const tools = [
  {
    href: "/meeting",
    icon: Mic,
    name: "Meeting Intelligence",
    description: "Transcribe, summarize & analyze meetings",
    badge: "Live",
    badgeStyle: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    iconStyle: "bg-blue-400/10 text-blue-400",
    borderHover: "hover:border-blue-400/20",
    active: true,
  },
  {
    href: "/resume",
    icon: FileSearch,
    name: "Resume Screener",
    description: "AI-powered candidate ranking & analysis",
    badge: "Live",
    badgeStyle: "bg-violet-400/10 text-violet-400 border-violet-400/20",
    iconStyle: "bg-violet-400/10 text-violet-400",
    borderHover: "hover:border-violet-400/20",
    active: true,
  },
  {
    href: "#",
    icon: GitBranch,
    name: "Workflow Generator",
    description: "Build automations in plain English",
    badge: "Coming soon",
    badgeStyle: "bg-white/5 text-white/30 border-white/10",
    iconStyle: "bg-white/5 text-white/20",
    borderHover: "",
    active: false,
  },
  {
    href: "#",
    icon: CheckSquare,
    name: "Smart Tasks",
    description: "AI-extracted tasks from any source",
    badge: "Coming soon",
    badgeStyle: "bg-white/5 text-white/30 border-white/10",
    iconStyle: "bg-white/5 text-white/20",
    borderHover: "",
    active: false,
  },
];

export function ToolGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <Link
            key={tool.name}
            href={tool.active ? tool.href : "#"}
            onClick={(e) => {
              if (!tool.active) e.preventDefault();
            }}
            className={`group relative flex flex-col rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-5 transition-all duration-200 ${
              tool.active
                ? `cursor-pointer ${tool.borderHover} hover:bg-white/[0.04]`
                : "cursor-default opacity-40 pointer-events-none"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`h-9 w-9 rounded-[9px] flex items-center justify-center ${tool.iconStyle}`}>
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tool.badgeStyle}`}>
                {tool.badge}
              </span>
            </div>
            <p className="text-[13px] font-semibold text-white mb-1">{tool.name}</p>
            <p className="text-[12px] text-white/40 leading-snug flex-1">{tool.description}</p>
            {tool.active && (
              <div className="mt-4 flex items-center gap-1 text-[11px] text-white/25 group-hover:text-white/50 transition-colors">
                Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
