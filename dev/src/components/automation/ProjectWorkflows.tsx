"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, GitBranch, Play, Pause, Trash2, Clock,
  Zap, MoreHorizontal, ArrowRight, Edit3, Copy, Settings2,
} from "lucide-react";
import { AutomationProject, AutomationWorkflow } from "@/types/automation";
import {
  getProjects, getWorkflows, saveWorkflow, deleteWorkflow,
  generateId,
} from "@/lib/automation-storage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatRelativeTime(iso?: string): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface NewWorkflowModalProps {
  projectId: string;
  onClose: () => void;
  onSave: (wf: AutomationWorkflow) => void;
}

function NewWorkflowModal({ projectId, onClose, onSave }: NewWorkflowModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit() {
    if (!name.trim()) return;
    onSave({
      id: generateId(),
      projectId,
      name: name.trim(),
      description: description.trim(),
      isActive: false,
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runCount: 0,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#111] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <p className="text-[15px] font-semibold text-white">New Workflow</p>
          <p className="text-[11px] text-white/40 mt-0.5">Add an automation workflow to this project</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Workflow Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. Image to JSON Processor"
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-[13px] rounded-lg px-3 h-9 focus:outline-none focus:border-indigo-500/50 placeholder:text-white/20 transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-white/50 mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this workflow do?"
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white text-[12px] rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500/50 placeholder:text-white/20 resize-none transition-colors"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-white/[0.07] flex items-center justify-end gap-2.5">
          <button onClick={onClose} className="h-8 px-4 rounded-lg text-[12px] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="h-8 px-4 rounded-lg text-[12px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProjectWorkflowsProps {
  projectId: string;
}

export function ProjectWorkflows({ projectId }: ProjectWorkflowsProps) {
  const router = useRouter();
  const [project, setProject] = useState<AutomationProject | null>(null);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    const projects = getProjects();
    const found = projects.find((p) => p.id === projectId);
    setProject(found ?? null);
    setWorkflows(getWorkflows(projectId));
  }, [projectId]);

  function handleSaveWorkflow(wf: AutomationWorkflow) {
    saveWorkflow(wf);
    setWorkflows(getWorkflows(projectId));
    toast.success("Workflow created!");
    router.push(`/automation/${projectId}/${wf.id}`);
  }

  function handleDeleteWorkflow(id: string) {
    if (!confirm("Delete this workflow?")) return;
    deleteWorkflow(id);
    setWorkflows(getWorkflows(projectId));
    toast.success("Workflow deleted");
  }

  function handleToggleActive(wf: AutomationWorkflow) {
    saveWorkflow({ ...wf, isActive: !wf.isActive, updatedAt: new Date().toISOString() });
    setWorkflows(getWorkflows(projectId));
    toast.success(wf.isActive ? "Workflow paused" : "Workflow activated");
  }

  function handleDuplicate(wf: AutomationWorkflow) {
    const dup: AutomationWorkflow = {
      ...wf,
      id: generateId(),
      name: wf.name + " (Copy)",
      isActive: false,
      runCount: 0,
      lastRun: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveWorkflow(dup);
    setWorkflows(getWorkflows(projectId));
    toast.success("Workflow duplicated");
  }

  if (!project) return null;

  const activeCount = workflows.filter((w) => w.isActive).length;
  const totalRuns = workflows.reduce((a, w) => a + (w.runCount ?? 0), 0);

  return (
    <div className="flex flex-col -mx-8 -my-8 min-h-full">
      {showNewModal && (
        <NewWorkflowModal
          projectId={projectId}
          onClose={() => setShowNewModal(false)}
          onSave={handleSaveWorkflow}
        />
      )}
      {menuOpen && <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(null)} />}

      {/* Header */}
      <div className="px-8 pt-7 pb-6 border-b border-white/[0.05]">
        <button
          onClick={() => router.push("/automation")}
          className="flex items-center gap-1.5 text-white/30 hover:text-white/70 text-[11px] mb-3 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> AI Automation
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-[20px]">
              {project.icon}
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-white">{project.name}</h1>
              {project.description && (
                <p className="text-[12px] text-white/35 mt-0.5">{project.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="h-3.5 w-3.5" /> New Workflow
          </button>
        </div>

        <div className="flex items-center gap-5 mt-4">
          {[
            { label: "Workflows", value: workflows.length, icon: GitBranch, color: "text-blue-400" },
            { label: "Active", value: activeCount, icon: Play, color: "text-emerald-400" },
            { label: "Total Runs", value: totalRuns, icon: Zap, color: "text-orange-400" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <s.icon className={cn("h-3.5 w-3.5", s.color)} />
              <span className="text-[13px] font-bold text-white">{s.value}</span>
              <span className="text-[11px] text-white/30">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Workflows */}
      <div className="px-8 py-6">
        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center mb-4">
              <GitBranch className="h-7 w-7 text-indigo-400" />
            </div>
            <p className="text-[15px] font-semibold text-white mb-1">No workflows yet</p>
            <p className="text-[12px] text-white/35 max-w-xs mb-5">
              Create your first workflow to start automating with AI nodes
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[12px] font-semibold rounded-xl transition-all"
            >
              Create First Workflow
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all overflow-hidden"
              >
                {/* Active indicator */}
                {wf.isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 rounded-l-2xl" />
                )}

                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Icon */}
                  <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center flex-shrink-0">
                    <GitBranch className="h-4.5 w-4.5 text-indigo-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-semibold text-white truncate">{wf.name}</p>
                      {wf.isActive && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-400/10 flex-shrink-0">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[9px] font-medium text-emerald-400">Active</span>
                        </div>
                      )}
                    </div>
                    {wf.description && (
                      <p className="text-[11px] text-white/35 truncate">{wf.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-white/25">{wf.nodes.length} nodes</span>
                      <span className="text-[10px] text-white/25">·</span>
                      <span className="text-[10px] text-white/25">{wf.runCount ?? 0} runs</span>
                      <span className="text-[10px] text-white/25">·</span>
                      <Clock className="h-2.5 w-2.5 text-white/20" />
                      <span className="text-[10px] text-white/25">Last run {formatRelativeTime(wf.lastRun)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(wf); }}
                      className={cn(
                        "h-7 px-2.5 rounded-lg text-[10px] font-medium flex items-center gap-1.5 transition-all",
                        wf.isActive
                          ? "text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20"
                          : "text-white/40 bg-white/[0.05] hover:bg-white/[0.09] hover:text-white/70"
                      )}
                    >
                      {wf.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      {wf.isActive ? "Pause" : "Activate"}
                    </button>

                    <button
                      onClick={() => router.push(`/automation/${projectId}/${wf.id}`)}
                      className="h-7 px-2.5 rounded-lg text-[10px] font-medium text-white/50 bg-white/[0.05] hover:bg-indigo-600 hover:text-white flex items-center gap-1.5 transition-all"
                    >
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>

                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === wf.id ? null : wf.id); }}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/70 hover:bg-white/[0.07] transition-all opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                      {menuOpen === wf.id && (
                        <div className="absolute right-0 top-8 z-50 w-36 rounded-xl border border-white/[0.08] bg-[#111] shadow-2xl py-1">
                          <button
                            onClick={() => { setMenuOpen(null); handleDuplicate(wf); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors"
                          >
                            <Copy className="h-3 w-3" /> Duplicate
                          </button>
                          <button
                            onClick={() => { setMenuOpen(null); handleDeleteWorkflow(wf.id); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-400 hover:bg-white/[0.05] transition-colors"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <ArrowRight className="h-4 w-4 text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            ))}

            {/* Add new workflow card */}
            <button
              onClick={() => setShowNewModal(true)}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border border-dashed border-white/[0.08] text-white/25 hover:text-white/50 hover:border-white/[0.15] hover:bg-white/[0.02] transition-all"
            >
              <div className="h-10 w-10 rounded-xl border border-dashed border-white/[0.1] flex items-center justify-center flex-shrink-0">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-[13px] font-medium">New Workflow</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
