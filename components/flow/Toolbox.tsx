import { useDraggable } from "@dnd-kit/core";
import { Sparkles, PlayCircle, GitBranch, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeType } from "@/lib/types";

const ITEMS: { type: NodeType; label: string }[] = [
  { type: "trigger", label: "Trigger" },
  { type: "action", label: "Action" },
  { type: "decision", label: "Decision" },
  { type: "group", label: "Group" },
];

const typeIcon = {
  trigger: PlayCircle,
  action: Sparkles,
  decision: GitBranch,
  group: Calculator,
};

export function Toolbox() {
  return (
    <aside className="w-40 border-r bg-muted/40 p-2">
      <h2 className="mb-2 text-sm font-semibold">Toolbox</h2>
      <ul className="space-y-2">
        {ITEMS.map((item) => (
          <ToolboxItem key={item.type} {...item} />
        ))}
      </ul>
    </aside>
  );
}

interface ToolboxItemProps {
  type: NodeType;
  label: string;
}

function ToolboxItem({ type, label }: ToolboxItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tool-${type}`,
    data: { nodeType: type },
  });

  const Icon = typeIcon[type];

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "flex cursor-grab items-center gap-1 rounded-sm border bg-background p-1 text-xs shadow-sm",
        isDragging && "opacity-50"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </li>
  );
} 