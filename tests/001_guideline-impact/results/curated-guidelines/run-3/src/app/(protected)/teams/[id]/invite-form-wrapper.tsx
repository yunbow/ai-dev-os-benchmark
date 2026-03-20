"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InviteForm } from "@/features/teams/components/invite-form";

interface InviteFormWrapperProps {
  teamId: string;
}

export function InviteFormWrapper({ teamId }: InviteFormWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <UserPlus className="h-4 w-4 mr-2" />
        Invite member
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <InviteForm
            teamId={teamId}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
