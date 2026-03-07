export const getSessionTitle = (title: string): string => {
  const suffixMatch = title.match(/ :\w+$/);
  if (suffixMatch) {
    return title.slice(0, suffixMatch.index);
  }
  return title;
};
