"use client";

import {
  Background,
  Controls,
  type Edge,
  Handle,
  MiniMap,
  type Node,
  type NodeTypes,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shared/components/ui/select";
import type { ProjectPlan } from "@/modules/validation/types/validation.types";

interface MilestoneOption {
  id: string;
  title: string;
  phaseId?: string;
}

interface ProjectFlowchartProps {
  plan: ProjectPlan;
  milestones: MilestoneOption[];
}

const NODE_WIDTH = 280;
const NODE_HEIGHT = 72;
const VERTICAL_GAP = 48;
const CENTER_X = 200;

const nodeTypes: NodeTypes = {
  start: ({ data }) => (
    <div className="w-[280px] rounded-lg border-2 border-primary bg-primary/10 px-4 py-3 text-center">
      <Handle type="source" position={Position.Bottom} />
      <div className="font-semibold text-primary text-sm">{data.label}</div>
    </div>
  ),
  process: ({ data }) => (
    <div className="w-[280px] rounded-lg border-2 border-primary/60 bg-primary/5 px-4 py-3 text-center">
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="font-medium text-foreground text-sm">{data.label}</div>
      {data.description ? (
        <div className="mt-1 line-clamp-2 text-muted-foreground text-xs">
          {data.description}
        </div>
      ) : null}
    </div>
  ),
  task: ({ data }) => (
    <div
      className={`w-[280px] rounded-lg border-2 px-4 py-3 text-center ${
        data.done
          ? "border-emerald-500/50 bg-emerald-500/10"
          : "border-border bg-muted/30"
      }`}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="font-medium text-sm">{data.label}</div>
      {data.description ? (
        <div className="mt-1 text-muted-foreground text-xs">{data.description}</div>
      ) : null}
    </div>
  ),
  end: ({ data }) => (
    <div className="w-[280px] rounded-lg border-2 border-destructive/60 bg-destructive/10 px-4 py-3 text-center">
      <Handle type="target" position={Position.Top} />
      <div className="font-semibold text-destructive text-sm">{data.label}</div>
    </div>
  ),
};

function buildLinearGraph(
  plan: ProjectPlan,
  milestone: MilestoneOption,
): { nodes: Node[]; edges: Edge[] } {
  const phase = milestone.phaseId
    ? plan.phases.find((item) => item.id === milestone.phaseId)
    : plan.phases[0];

  if (!phase) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let y = 0;
  let previousId: string | null = null;

  const addNode = (id: string, type: string, label: string, extra?: Record<string, unknown>) => {
    nodes.push({
      id,
      type,
      position: { x: CENTER_X, y },
      data: { label, ...extra },
    });
    if (previousId) {
      edges.push({
        id: `${previousId}-${id}`,
        source: previousId,
        target: id,
        type: "straight",
        animated: true,
      });
    }
    previousId = id;
    y += NODE_HEIGHT + VERTICAL_GAP;
  };

  addNode("start", "start", "Start");
  addNode(phase.id, "process", phase.name, {
    description: phase.description,
  });

  for (const task of phase.tasks) {
    addNode(task.id, "task", task.title, {
      description: task.status.replace("_", " "),
      done: task.status === "DONE",
    });
  }

  addNode("end", "end", "Milestone complete");

  return { nodes, edges };
}

function FlowchartContent({ plan, milestones }: ProjectFlowchartProps) {
  const { fitView } = useReactFlow();
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(
    milestones[0]?.id ?? "",
  );

  const selectedMilestone =
    milestones.find((milestone) => milestone.id === selectedMilestoneId) ??
    milestones[0];

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () =>
      selectedMilestone
        ? buildLinearGraph(plan, selectedMilestone)
        : { nodes: [], edges: [] },
    [plan, selectedMilestone],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    if (nodes.length > 0) {
      const timeoutId = setTimeout(() => {
        fitView({ padding: 0.4, duration: 300, maxZoom: 1.2 });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [nodes, fitView]);

  if (!selectedMilestone || nodes.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border">
        <p className="text-muted-foreground text-sm">No milestone data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-sm">Milestone roadmap</p>
          <p className="text-muted-foreground text-xs">
            Linear flow from start to completion
          </p>
        </div>
        <Select onValueChange={setSelectedMilestoneId} value={selectedMilestoneId}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select milestone" />
          </SelectTrigger>
          <SelectContent>
            {milestones.map((milestone) => (
              <SelectItem key={milestone.id} value={milestone.id}>
                {milestone.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative h-[600px] w-full overflow-hidden rounded-lg border">
        <ReactFlow
          colorMode="dark"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          className="bg-background"
          nodesDraggable={false}
          nodesConnectable={false}
          minZoom={0.4}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="hsl(var(--border))" />
          <Controls />
          <MiniMap
            color="hsl(var(--background))"
            nodeColor="hsl(var(--primary))"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export function ProjectFlowchart({ plan, milestones }: ProjectFlowchartProps) {
  if (!plan?.phases?.length || milestones.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border">
        <p className="text-muted-foreground text-sm">No milestones available</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <FlowchartContent milestones={milestones} plan={plan} />
    </ReactFlowProvider>
  );
}
