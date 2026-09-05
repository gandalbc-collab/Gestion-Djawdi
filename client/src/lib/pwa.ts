export function isAppleMobileDevice(userAgent: string, maxTouchPoints: number): boolean {
  return /iPad|iPhone|iPod/.test(userAgent) || (userAgent.includes("Mac") && maxTouchPoints > 1);
}
