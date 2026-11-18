// Loads images into the browser cache and resolves when all are done (a failed image never blocks).
export function preloadImages(urls: string[]): Promise<void> {
  return Promise.all(urls.map((u) => new Promise<void>((res) => {
    const i = new Image(); i.onload = () => res(); i.onerror = () => res(); i.src = u;
  }))).then(() => undefined);
}
