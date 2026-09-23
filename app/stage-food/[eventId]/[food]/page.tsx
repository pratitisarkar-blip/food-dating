"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSocket } from "@/lib/useSocket";

function storageKey(eventId: string) {
  return `food-dating:${eventId}:participant`;
}

export default function StageFoodPage() {
  const params = useParams<{ eventId: string; food: string }>();
  const [msg, setMsg] = useState("Bringing you back on stage...");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const onErr = (text: string) => {
      setMsg(text);
      setOk(false);
      window.setTimeout(() => {
        window.location.href = `/join/${params.eventId}?resume=volunteer`;
      }, 900);
    };
    const onJoined = ({ participantId }: { participantId: string }) => {
      localStorage.setItem(storageKey(params.eventId), participantId);
    };
    const onOk = ({ participantId }: { participantId?: string }) => {
      if (participantId) localStorage.setItem(storageKey(params.eventId), participantId);
      setOk(true);
      setMsg("Locked in. Opening your questions.");
      window.setTimeout(() => {
        window.location.href = `/join/${params.eventId}?resume=volunteer`;
      }, 400);
    };
    socket.on("error-message", onErr);
    socket.on("joined", onJoined);
    socket.on("food-attached", onOk);
    socket.emit("hello", { role: "audience", eventId: params.eventId, claimVolunteer: true });
    socket.emit("scan-food", { eventId: params.eventId, foodSlug: params.food });
    return () => {
      socket.off("error-message", onErr);
      socket.off("joined", onJoined);
      socket.off("food-attached", onOk);
    };
  }, [params.eventId, params.food]);

  return (
    <div className="wait">
      <p className="tag">{params.food}</p>
      <h1 className="display">{ok ? "IT'S A DATE" : "HOLD ON"}</h1>
      <p className="serif">{msg}</p>
    </div>
  );
}
