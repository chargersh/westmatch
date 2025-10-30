// polyfill MessageChannel without using node:events
if (typeof MessageChannel === "undefined") {
  class MockMessagePort {
    onmessage: ((ev: MessageEvent) => void) | undefined;
    onmessageerror: ((ev: MessageEvent) => void) | undefined;

    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional stub method
    close() {}
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional stub method
    postMessage(_message: unknown, _transfer: Transferable[] = []) {}
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional stub method
    start() {}
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional stub method
    addEventListener() {}
    // biome-ignore lint/suspicious/noEmptyBlockStatements: intentional stub method
    removeEventListener() {}
    dispatchEvent(_event: Event): boolean {
      return false;
    }
  }

  class MockMessageChannel {
    port1: MockMessagePort;
    port2: MockMessagePort;

    constructor() {
      this.port1 = new MockMessagePort();
      this.port2 = new MockMessagePort();
    }
  }

  globalThis.MessageChannel =
    MockMessageChannel as unknown as typeof MessageChannel;
}
