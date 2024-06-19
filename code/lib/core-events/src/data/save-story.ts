export interface SaveStoryRequestPayload {
  args: string | undefined;
  csfId: string;
  importPath: string;
  name?: string;
}

export interface SaveStoryResponsePayload {
  csfId: string;
  newStoryId?: string;
  newStoryName?: string;
  newStorySource?: string;
  sourceFileName?: string;
  sourceStoryName?: string;
}
