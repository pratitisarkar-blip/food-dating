function foodDatingGo(kind, slug) {
  const origin = String(window.FOOD_DATING_ORIGIN || "").replace(/\/$/, "");
  const eventId = window.FOOD_DATING_EVENT || "FOOD-DATING-001";
  if (!origin || origin.includes("REPLACE-WITH")) {
    document.body.innerHTML =
      "<h1>Not pointed yet</h1><p>On show day, set today's public URL in config.js, then these printed codes will work.</p>";
    return;
  }
  if (kind === "join") {
    location.replace(origin + "/join/" + eventId);
    return;
  }
  location.replace(origin + "/stage-food/" + eventId + "/" + slug);
}
