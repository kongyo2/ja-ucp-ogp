export const sanitize = (s: string): string => s.replace(/[<>:"/\\|?*\s]/g, "_").substring(0, 40);

export const WIKI_BASE_URL = "ansaikuropedia.org/wiki/";
