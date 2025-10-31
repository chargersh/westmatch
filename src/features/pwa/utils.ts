const BASE64_BLOCK_SIZE = 4;
const BASE64_PADDING_CHAR = "=";

export function urlBase64ToUint8Array(base64String: string) {
  const paddingLength =
    (BASE64_BLOCK_SIZE - (base64String.length % BASE64_BLOCK_SIZE)) %
    BASE64_BLOCK_SIZE;
  const padding = BASE64_PADDING_CHAR.repeat(paddingLength);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
