const ws = typeof WebSocket !== 'undefined'
  ? WebSocket
  : typeof global !== 'undefined'
    ? global.WebSocket
    : undefined;

export { ws as WebSocket };
export default ws;
