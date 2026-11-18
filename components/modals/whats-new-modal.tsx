"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { markWhatsNewSeen } from "@/actions/whats-new";
import type { Announcement } from "@/lib/whats-new";

type Props = {
  announcement: Announcement;
  alreadySeen: boolean;
};

export const WhatsNewModal = ({ announcement, alreadySeen }: Props) => {
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(!alreadySeen);

  useEffect(() => setIsClient(true), []);

  if (!isClient) {
    return null;
  }

  const onClose = () => {
    setIsOpen(false);
    markWhatsNewSeen(announcement.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            🎉 {announcement.title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Atualizámos o Leolingo! Isto é novo:
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
          {announcement.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <DialogFooter>
          <Button
            variant="primary"
            className="w-full"
            size="lg"
            onClick={onClose}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
