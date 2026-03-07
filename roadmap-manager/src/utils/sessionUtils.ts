export const getSessionTitle = (title: string): string => {
  const suffixMatch = title.match(/ :[a-zA-Z0-9_-]+$/);
  if (suffixMatch) {
    return title.slice(0, suffixMatch.index);
  }
  return title;
};
