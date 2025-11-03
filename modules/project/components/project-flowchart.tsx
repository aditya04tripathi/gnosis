"use client";

import {
  addEdge,
  Background,
  type Connection,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import type { ProjectPlan } from "@/modules/validation/types/validation.types";

interface ProjectFlowchartProps {
  plan: ProjectPlan;
}

const nodeTypes: NodeTypes = {
  start: ({ data }) => (
    <div
      className="rounded-lg border-2 border-primary bg-primary/10 px-4 py-2 text-center"
      style={{ maxWidth: "500px", minHeight: "100px" }}
    >
      <Handle type="source" position={Position.Bottom} />
      <div className="font-semibold text-primary">{data.label}</div>
    </div>
  ),
  process: ({ data }) => (
    <div
      className="rounded-lg border-2 border-primary bg-primary/5 px-4 py-2 text-center"
      style={{ maxWidth: "500px", minHeight: "100px" }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="font-semibold text-foreground">{data.label}</div>
      {data.description && (
        <div className="mt-1 text-xs text-muted-foreground">
          {data.description}
        </div>
      )}
    </div>
  ),
  decision: ({ data }) => (
    <div
      className="rounded-lg border-2 border-accent bg-accent/20 px-4 py-2 text-center"
      style={{ maxWidth: "500px", minHeight: "100px" }}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="font-semibold text-accent-foreground">{data.label}</div>
      {data.description && (
        <div className="mt-1 text-xs text-accent-foreground/80">
          {data.description}
        </div>
      )}
    </div>
  ),
  end: ({ data }) => (
    <div
      className="rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-2 text-center"
      style={{ maxWidth: "500px", minHeight: "100px" }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="font-semibold text-destructive">{data.label}</div>
    </div>
  ),
};

function FlowchartContent({ plan }: ProjectFlowchartProps) {
  const { fitView } = useReactFlow();

  const [primaryColor, setPrimaryColor] = useState("hsl(var(--primary))");
  const [borderColor, setBorderColor] = useState("hsl(var(--border))");

  useEffect(() => {
    
    const root = document.documentElement;
    const computedPrimary = getComputedStyle(root)
      .getPropertyValue("--primary")
      .trim();
    const computedBorder = getComputedStyle(root)
      .getPropertyValue("--border")
      .trim();

    if (computedPrimary) {
      setPrimaryColor(computedPrimary);
    }
    if (computedBorder) {
      setBorderColor(computedBorder);
    }
  }, []);

  const initialNodes = useMemo(() => {
    const nodes: Node[] = [];

    if (!plan || !plan.phases || plan.phases.length === 0) {
      console.log("No phases found in plan:", plan);
      return nodes;
    }

    console.log("Creating flowchart with phases:", plan.phases.length);

    const NODE_MIN_HEIGHT = 100; 
    const NODE_AVG_WIDTH = 200; 
    const CENTER_X = 600;
    const PHASE_TO_START_SPACING = 180; 
    const PHASE_TO_TASK_SPACING = 160; 
    const TASK_TO_NEXT_PHASE_SPACING = 220; 
    const TASK_HORIZONTAL_SPACING = 280; 
    const TASK_VERTICAL_SPACING = 160; 
    const ROW_OFFSET = 120; 
    const START_Y = 50;
    const MAX_TASKS_PER_ROW = 4; 

    nodes.push({
      id: "start",
      type: "start",
      position: { x: CENTER_X - NODE_AVG_WIDTH / 2, y: START_Y },
      data: { label: "Project Start" },
    });

    let currentY = START_Y + NODE_MIN_HEIGHT + PHASE_TO_START_SPACING;

    plan.phases.forEach((phase) => {
      
      const phaseX = CENTER_X - NODE_AVG_WIDTH / 2;
      const phaseY = currentY;

      nodes.push({
        id: phase.id,
        type: "process",
        position: { x: phaseX, y: phaseY },
        data: {
          label: phase.name,
          description: phase.description,
          phaseId: phase.id,
        },
      });

      if (phase.tasks.length === 0) {
        
        currentY = phaseY + NODE_MIN_HEIGHT + TASK_TO_NEXT_PHASE_SPACING;
        return;
      }

      const taskRows = Math.ceil(phase.tasks.length / MAX_TASKS_PER_ROW);
      const firstTaskY = phaseY + NODE_MIN_HEIGHT + PHASE_TO_TASK_SPACING;

      phase.tasks.forEach((task, taskIndex) => {
        const row = Math.floor(taskIndex / MAX_TASKS_PER_ROW);
        const col = taskIndex % MAX_TASKS_PER_ROW;
        const tasksInThisRow = Math.min(
          MAX_TASKS_PER_ROW,
          phase.tasks.length - row * MAX_TASKS_PER_ROW,
        );

        const rowWidth = (tasksInThisRow - 1) * TASK_HORIZONTAL_SPACING;
        const rowCenterX = CENTER_X - rowWidth / 2 - NODE_AVG_WIDTH / 2;

        const rowOffset = row % 2 === 1 ? ROW_OFFSET : -ROW_OFFSET;
        const rowStartX = rowCenterX + rowOffset;

        const taskX = rowStartX + col * TASK_HORIZONTAL_SPACING;
        const taskYPos =
          firstTaskY + row * (NODE_MIN_HEIGHT + TASK_VERTICAL_SPACING);

        nodes.push({
          id: task.id,
          type: task.status === "DONE" ? "process" : "decision",
          position: {
            x: taskX,
            y: taskYPos,
          },
          data: {
            label: task.title,
            description: `${task.status} - ${task.priority} priority`,
            taskId: task.id,
            phaseId: phase.id,
          },
        });
      });

      const lastTaskRow = taskRows - 1;
      const maxTaskY =
        firstTaskY +
        lastTaskRow * (NODE_MIN_HEIGHT + TASK_VERTICAL_SPACING) +
        NODE_MIN_HEIGHT;
      currentY = maxTaskY + TASK_TO_NEXT_PHASE_SPACING;
    });

    const endY = currentY;
    nodes.push({
      id: "end",
      type: "end",
      position: { x: CENTER_X - NODE_AVG_WIDTH / 2, y: endY },
      data: { label: "Project Complete" },
    });

    return nodes;
  }, [plan]);

  const initialEdges = useMemo(() => {
    
    const defaultColor = "hsl(var(--primary))";
    const edges: Edge[] = [];

    if (!plan || !plan.phases || plan.phases.length === 0) {
      return edges;
    }

    if (plan.phases.length > 0) {
      edges.push({
        id: "start-phase0",
        source: "start",
        target: plan.phases[0].id,
        type: "smoothstep",
        animated: true,
      });
    }

    plan.phases.forEach((phase, phaseIndex) => {
      
      const MAX_TASKS_PER_ROW = 4;
      const firstTaskInEachRow = phase.tasks.filter(
        (_, index) => index % MAX_TASKS_PER_ROW === 0,
      );

      firstTaskInEachRow.forEach((task) => {
        edges.push({
          id: `${phase.id}-${task.id}`,
          source: phase.id,
          target: task.id,
          type: "smoothstep",
        });
      });

      phase.tasks.forEach((task, taskIndex) => {
        const row = Math.floor(taskIndex / MAX_TASKS_PER_ROW);
        const col = taskIndex % MAX_TASKS_PER_ROW;
        const tasksInRow = Math.min(
          MAX_TASKS_PER_ROW,
          phase.tasks.length - row * MAX_TASKS_PER_ROW,
        );

        if (col < tasksInRow - 1) {
          const nextTask = phase.tasks[taskIndex + 1];
          edges.push({
            id: `${task.id}-${nextTask.id}`,
            source: task.id,
            target: nextTask.id,
            type: "smoothstep",
          });
        }

        if (
          col === tasksInRow - 1 &&
          row < Math.ceil(phase.tasks.length / MAX_TASKS_PER_ROW) - 1
        ) {
          const firstTaskNextRow = phase.tasks[(row + 1) * MAX_TASKS_PER_ROW];
          if (firstTaskNextRow) {
            edges.push({
              id: `${task.id}-${firstTaskNextRow.id}`,
              source: task.id,
              target: firstTaskNextRow.id,
              type: "smoothstep",
            });
          }
        }
      });

      if (phaseIndex < plan.phases.length - 1 && phase.tasks.length > 0) {
        const nextPhase = plan.phases[phaseIndex + 1];
        const lastTask = phase.tasks[phase.tasks.length - 1];

        edges.push({
          id: `${lastTask.id}-${nextPhase.id}`,
          source: lastTask.id,
          target: nextPhase.id,
          type: "smoothstep",
          animated: true,
        });
      }

      if (phase.dependencies.length > 0) {
        phase.dependencies.forEach((depId) => {
          const depPhase = plan.phases.find((p) => p.id === depId);
          if (depPhase && depPhase.tasks.length > 0 && phase.tasks.length > 0) {
            const depLastTask = depPhase.tasks[depPhase.tasks.length - 1];
            const currentFirstTask = phase.tasks[0];

            if (depLastTask && currentFirstTask) {
              edges.push({
                id: `dep-${depLastTask.id}-${currentFirstTask.id}`,
                source: depLastTask.id,
                target: currentFirstTask.id,
                type: "smoothstep",
                animated: true,
                style: { stroke: defaultColor, strokeWidth: 2 },
                markerEnd: {
                  type: "arrowclosed",
                  color: defaultColor,
                },
              });
            }
          }
        });
      }
    });

    if (plan.phases.length > 0) {
      const lastPhase = plan.phases[plan.phases.length - 1];
      if (lastPhase.tasks.length > 0) {
        const lastTask = lastPhase.tasks[lastPhase.tasks.length - 1];
        edges.push({
          id: `${lastTask.id}-end`,
          source: lastTask.id,
          target: "end",
          type: "smoothstep",
          animated: true,
        });
      } else {
        
        edges.push({
          id: `${lastPhase.id}-end`,
          source: lastPhase.id,
          target: "end",
          type: "smoothstep",
          animated: true,
        });
      }
    }

    return edges;
  }, [plan]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        const updatedEdge: Edge = {
          ...edge,
          style: { ...(edge.style || {}), stroke: primaryColor },
        };
        if (edge.markerEnd && typeof edge.markerEnd === "object") {
          updatedEdge.markerEnd = {
            ...edge.markerEnd,
            color: primaryColor,
          } as typeof edge.markerEnd;
        }
        return updatedEdge;
      }),
    );
  }, [primaryColor, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  useEffect(() => {
    if (nodes.length > 0) {
      const timeoutId = setTimeout(() => {
        try {
          fitView({ padding: 0.3, duration: 400, maxZoom: 1 });
        } catch (error) {
          console.error("Error fitting view:", error);
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [nodes.length, fitView]);

  if (nodes.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <p className="text-muted-foreground">Loading flowchart...</p>
      </div>
    );
  }

  console.log(
    "Rendering ReactFlow with nodes:",
    nodes.length,
    "edges:",
    edges.length,
  );

  return (
    <div
      className="h-[600px] w-full border rounded-lg overflow-hidden relative"
      style={{ minHeight: "600px", minWidth: "100%" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        className="bg-background"
        connectionLineStyle={{ stroke: primaryColor, strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: primaryColor, strokeWidth: 2 },
          animated: false,
          markerEnd: {
            type: "arrowclosed",
            color: primaryColor,
          },
        }}
        nodesDraggable={true}
        nodesConnectable={false}
        edgesFocusable={false}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color={borderColor} />
        <Controls />
        <MiniMap nodeColor={primaryColor} />
      </ReactFlow>
    </div>
  );
}

export function ProjectFlowchart({ plan }: ProjectFlowchartProps) {
  if (!plan || !plan.phases || plan.phases.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center border rounded-lg">
        <p className="text-muted-foreground">No phases available</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <FlowchartContent plan={plan} />
    </ReactFlowProvider>
  );
}
