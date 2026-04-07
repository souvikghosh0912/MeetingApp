import { ProjectWorkflows } from "@/components/automation/ProjectWorkflows";

export const metadata = { title: "Project Workflows | Nexus" };

interface Props {
  params: { projectId: string };
}

export default function ProjectPage({ params }: Props) {
  return <ProjectWorkflows projectId={params.projectId} />;
}
