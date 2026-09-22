"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSocket } from "@/lib/useSocket";

export default function StageFoodPage() {
  const params = useParams<{ eventId: string; food: string }>();
  const [msg, setMsg] = useState("Linking this food to the volunteer...");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const onErr = (text: string) => {
      setMsg(text);
      setOk(false);
    };
    const onOk = () => {
      setOk(true);
      setMsg("Locked in. Look up.");
      window.setTimeout(() => {
        window.location.href = `/join/${params.eventId}`;
      }, 900);
    };
    socket.on("error-message", onErr);
    socket.on("food-attached", onOk);
    socket.emit("hello", { role: "audience", eventId: params.eventId });
    socket.emit("scan-food", { eventId: params.eventId, foodSlug: params.food });
    return () => {
      socket.off("error-message", onErr);
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
