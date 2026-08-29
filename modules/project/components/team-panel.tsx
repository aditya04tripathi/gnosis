"use client";

import { Mail, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { inviteTeamMember } from "@/modules/project/actions/team";
import type { TeamMemberData, TeamRole } from "@/modules/project/types/project.types";
import { Badge } from "@/modules/shared/components/ui/badge";
import { Button } from "@/modules/shared/components/ui/button";
import { Input } from "@/modules/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shared/components/ui/select";

interface TeamPanelProps {
  projectPlanId: string;
  members: TeamMemberData[];
}

export function TeamPanel({ projectPlanId, members }: TeamPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("member");

  const handleInvite = () => {
    startTransition(async () => {
      const result = await inviteTeamMember(projectPlanId, email, role);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Invitation sent");
      setEmail("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="size-4" />
        <h3 className="font-semibold text-base">Team</h3>
        <Badge variant="secondary">{members.length}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          type="email"
          value={email}
        />
        <Select onValueChange={(v) => setRole(v as TeamRole)} value={role}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Button disabled={isPending || !email} onClick={handleInvite} size="sm">
          <UserPlus className="size-4" />
          Invite
        </Button>
      </div>

      <div className="divide-y rounded-lg border">
        {members.map((member) => (
          <div
            className="flex items-center justify-between px-4 py-3"
            key={member.email}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted font-medium text-xs">
                {(member.name ?? member.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{member.name ?? member.email}</p>
                <p className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Mail className="size-3" />
                  {member.email}
                </p>
              </div>
            </div>
            <Badge variant="outline">{member.role}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
