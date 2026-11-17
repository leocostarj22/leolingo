"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/ad-slot";
import { refillHeartsWithAd } from "@/actions/user-progress";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { useMascot } from "@/store/use-mascot";

export const HeartsModal = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [, startTransition] = useTransition();
  const { isOpen, close, signalHeartsRefilled } = useHeartsModal();
  const gender = useMascot((state) => state.gender);

  useEffect(() => setIsClient(true), []);

  const onClick = () => {
    close();
    router.push("/shop");
  };

  const onClose = () => {
    setWatchingAd(false);
    close();
  };

  const onAdComplete = () => {
    startTransition(() => {
      refillHeartsWithAd()
        .then(() => {
          onClose();
          signalHeartsRefilled();
        })
        .catch(() => {
          toast.error("Não foi possível recarregar os corações. Tenta novamente.");
        });
    });
  };

  if (!isClient) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center w-full justify-center mb-5">
            <Image
              src={gender === "FEMALE" ? "/juba.png" : "/leo.png"}
              alt="Mascot"
              height={80}
              width={80}
            />
          </div>
          <DialogTitle className="text-center font-bold text-2xl">
            Ficaste sem corações!
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Torna-te Pro para corações ilimitados, ou compra-os na loja.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mb-4">
          {watchingAd ? (
            <AdSlot
              title="Vê um anúncio curto"
              description="Os teus corações são recarregados quando o anúncio terminar."
              onComplete={onAdComplete}
            />
          ) : (
            <div className="flex flex-col gap-y-4 w-full">
              <Button
                variant="primary"
                className="w-full"
                size="lg"
                onClick={onClick}
              >
                Corações ilimitados
              </Button>
              <Button
                variant="secondaryOutline"
                className="w-full"
                size="lg"
                onClick={() => setWatchingAd(true)}
              >
                Ver anúncio
              </Button>
              <Button
                variant="primaryOutline"
                className="w-full"
                size="lg"
                onClick={onClose}
              >
                Agora não
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
