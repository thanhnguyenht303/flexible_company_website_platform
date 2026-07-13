export function getGalleryIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function getRequestedGalleryRemovalIds(gallery: unknown, requestedIds: readonly string[]) {
  const requested = new Set(requestedIds);
  return getGalleryIds(gallery).filter((id) => requested.has(id));
}
