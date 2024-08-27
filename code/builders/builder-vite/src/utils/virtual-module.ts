export function getResolvedVirtualModuleId(virtualModuleId: string) {
  return `\0${virtualModuleId}`;
}
