"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Folder, GitBranch, Clock, Zap, MoreHorizontal,
  Trash2, Edit3, Play, ArrowRight, Bot, Cpu, Globe,
} from "lucide-react";
import { AutomationProject, AutomationWorkflow } from "@/types/automation";
import {
  getProjects, saveProject, deleteProject, getAllWorkflows,
  generateId, seedDemoDataIfEmpty,
} from "@/lib/automation-storage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLORS = [
  { id: "violet", class: "from-violet-600/20 to-violet-800/10 border-violet-500/20", dot: "bg-violet-500", text: "text-violet-400" },
  { id: "blue", class: "from-blue-600/20 to-blue-800/10 border-blue-500/20", dot: "bg-blue-500", text: "text-blue-400" },
  { id: "emerald", class: "from-emerald-600/20 to-emerald-800/10 border-emerald-500/20", dot: "bg-emerald-500", text: "text-emerald-400" },
  { id: "orange", class: "from-orange-600/20 to-orange-800/10 border-orange-500/20", dot: "bg-orange-500", text: "text-orange-400" },
  { id: "pink", class: "from-pink-600/20 to-pink-800/10 border-pink-500/20", dot: "bg-pink-500", text: "text-pink-400" },
  { id: "cyan", class: "from-cyan-600/20 to-cyan-800/10 border-cyan-500/20", dot: "bg-cyan-500", text: "text-cyan-400" },
];

const ICONS = ["📄", "🚀", "🤖", "⚡", "🔗", "📊", "🧠", "🔧", "🌐", "📧", "🎯", "💡"];

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface NewProjectModalProps {
  onClose: () => void;
  onSave: (project: AutomationProject) => void;
}

function NewProjectModal({ onClose, onSave }: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🚀");
  const [color, setColor] = useState("violet");

  function handleSubmit() {
    if (!name.trim()) return;
    onSave({
      id: generateId(),
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      workflowCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <p className="text-[15px] font-semibold text-white">New Project</p>
          <p className="text-[11px] text-white/40 mt-0.5">Create a container for your automation workflows</p>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Icon & color row */}
          <div className="flex items-start gap-4">
            <div>
              <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Icon</label>
              <div className="grid grid-cols-6 gap-1">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center text-[14px] transition-all",
                      icon === ic ? "bg-white/15 ring-1 ring-white/30" : "hover:bg-white/[0.07]"
                    )}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Color</label>
              <div className="grid grid-cols-3 gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setColor(c.id)}
                    className={cn(
                      "h-7 rounded-lg border transition-all flex items-center gap-1.5 px-2",
                      color === c.id ? "ring-1 ring-white/30 " + c.class : "border-white/[0.06] hover:bg-white/[0.04]"
                    )}
                  >
                    <div className={cn("h-2 w-2 rounded-full", c.dot)} />
                    <span className="text-[10px] text-white/60 capitalize">{c.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Project Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="My Automation Project"
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-[13px] rounded-lg px-3 h-9 focus:outline-none focus:border-indigo-500/50 placeholder:text-white/20 transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will this project automate?"
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-[12px] rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500/50 placeholder:text-white/20 resize-none transition-colors"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/[0.07] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-lg text-[12px] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="h-8 px-4 rounded-lg text-[12px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

export function AutomationHome() {
  const router = useRouter();
  const [projects, setProjects] = useState<AutomationProject[]>([]);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    seedDemoDataIfEmpty();
    setProjects(getProjects());
    setWorkflows(getAllWorkflows());
  }, []);

  function handleSaveProject(p: AutomationProject) {
    saveProject(p);
    setProjects(getProjects());
    toast.success("Project created!");
  }

  function handleDeleteProject(id: string) {
    if (!confirm("Delete this project and all its workflows?")) return;
    deleteProject(id);
    setProjects(getProjects());
    setWorkflows(getAllWorkflows());
    toast.success("Project deleted");
  }

  const totalRuns = workflows.reduce((a, w) => a + (w.runCount ?? 0), 0);
  const activeWorkflows = workflows.filter((w) => w.isActive).length;

  function getColor(colorId: string) {
    return COLORS.find((c) => c.id === colorId) ?? COLORS[0];
  }

  return (
    <div className="flex flex-col -mx-8 -my-8 min-h-full">
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onSave={handleSaveProject}
        />
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(null)} />
      )}

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-white/[0.05]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-8 w-8 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
                <Zap className="h-4 w-4 text-indigo-400" />
              </div>
              <h1 className="text-[22px] font-bold text-white">AI Automation</h1>
            </div>
            <p className="text-[13px] text-white/40 ml-10.5">
              Build powerful n8n-style automation workflows with AI models and integrations
            </p>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> New Project
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-5">
          {[
            { label: "Projects", value: projects.length, icon: Folder, color: "text-violet-400" },
            { label: "Workflows", value: workflows.length, icon: GitBranch, color: "text-blue-400" },
            { label: "Active", value: activeWorkflows, icon: Play, color: "text-emerald-400" },
            { label: "Total Runs", value: totalRuns, icon: Zap, color: "text-orange-400" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
              <span className="text-[13px] font-bold text-white">{stat.value}</span>
              <span className="text-[11px] text-white/30">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Integration badges */}
      <div className="px-8 py-4 flex items-center gap-2 border-b border-white/[0.04]">
        <span className="text-[10px] text-white/25 uppercase tracking-widest mr-1">Integrations</span>
        {[
          { icon: "⚡", label: "NVIDIA NIM", color: "text-green-400 bg-green-400/10" },
          { icon: "🤖", label: "OpenAI", color: "text-violet-400 bg-violet-400/10" },
          { icon: "🐙", label: "GitHub", color: "text-slate-300 bg-slate-400/10" },
          { icon: "📁", label: "Google Drive", color: "text-blue-400 bg-blue-400/10" },
          { icon: "📧", label: "Gmail", color: "text-red-400 bg-red-400/10" },
          { icon: "🌐", label: "Webhooks", color: "text-orange-400 bg-orange-400/10" },
        ].map((int) => (
          <div
            key={int.label}
            className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.07] text-[10px] font-medium", int.color)}
          >
            <span>{int.icon}</span>
            <span>{int.label}</span>
          </div>
        ))}
      </div>

      {/* Projects grid */}
      <div className="px-8 py-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-3xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-[16px] font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-[13px] text-white/35 max-w-xs mb-6">
              Create your first automation project to start building n8n-style workflows
            </p>
            <button
              onClick={() => setShowNewProject(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold rounded-xl transition-all"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const col = getColor(project.color);
              const projectWorkflows = workflows.filter((w) => w.projectId === project.id);
              const activeCount = projectWorkflows.filter((w) => w.isActive).length;

              return (
                <div
                  key={project.id}
                  className={cn(
                    "relative group rounded-2xl border bg-gradient-to-br p-5 transition-all cursor-pointer hover:shadow-xl",
                    col.class
                  )}
                  onClick={() => router.push(`/automation/${project.id}`)}
                >
                  {/* Menu */}
                  <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/[0.07] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    {menuOpen === project.id && (
                      <div className="absolute right-0 top-8 z-50 w-36 rounded-xl border border-white/[0.08] bg-[#111] shadow-2xl py-1 overflow-hidden">
                        <button
                          onClick={() => { setMenuOpen(null); handleDeleteProject(project.id); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-400 hover:bg-white/[0.05] transition-colors"
                        >
                          <Trash2 className="h-3 w-3" /> Delete Project
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("h-10 w-10 rounded-xl border flex items-center justify-center text-[20px] flex-shrink-0", col.class)}>
                      {project.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-white truncate">{project.name}</p>
                      <p className="text-[10px] text-white/35">
                        Created {formatRelativeTime(project.createdAt)}
                      </p>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-[11px] text-white/40 leading-relaxed mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 pt-3 border-t border-white/[0.07]">
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="h-3 w-3 text-white/30" />
                      <span className="text-[11px] text-white/50">{project.workflowCount} workflows</span>
                    </div>
                    {activeCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] text-emerald-400/80">{activeCount} active</span>
                      </div>
                    )}
                    <div className="ml-auto">
                      <ArrowRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* New project card */}
            <button
              onClick={() => setShowNewProject(true)}
              className="rounded-2xl border border-dashed border-white/[0.1] p-5 flex flex-col items-center justify-center gap-2 text-white/25 hover:text-white/50 hover:border-white/20 hover:bg-white/[0.02] transition-all min-h-[140px]"
            >
              <Plus className="h-6 w-6" />
              <span className="text-[12px] font-medium">New Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Recent workflows section */}
      {workflows.length > 0 && (
        <div className="px-8 pb-8">
          <h2 className="text-[13px] font-semibold text-white/60 mb-3 uppercase tracking-widest">Recent Workflows</h2>
          <div className="space-y-2">
            {workflows
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 5)
              .map((wf) => {
                const project = projects.find((p) => p.id === wf.projectId);
                return (
                  <button
                    key={wf.id}
                    onClick={() => router.push(`/automation/${wf.projectId}/${wf.id}`)}
                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all text-left group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center flex-shrink-0">
                      <GitBranch className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-white truncate">{wf.name}</p>
                      <p className="text-[10px] text-white/30 truncate">
                        {project?.name} · {wf.nodes.length} nodes · {wf.runCount ?? 0} runs
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {wf.isActive && (
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] text-emerald-400/70">Active</span>
                        </div>
                      )}
                      <span className="text-[10px] text-white/25">{formatRelativeTime(wf.updatedAt)}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-white/15 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
