// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mock WebGL context
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2' || contextType === 'experimental-webgl') {
    return {
      viewport: jest.fn(),
      clearColor: jest.fn(),
      clear: jest.fn(),
      getExtension: jest.fn(),
      getParameter: jest.fn(() => 1024),
      enable: jest.fn(),
      disable: jest.fn(),
      useProgram: jest.fn(),
      createShader: jest.fn(() => ({})),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      getShaderParameter: jest.fn(() => true),
      createProgram: jest.fn(() => ({})),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      getProgramParameter: jest.fn(() => true),
      deleteShader: jest.fn(),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      createBuffer: jest.fn(() => ({})),
      getUniformLocation: jest.fn(() => ({})),
      uniformMatrix4fv: jest.fn(),
      uniform1f: jest.fn(),
      uniform2f: jest.fn(),
      uniform3f: jest.fn(),
      uniform4f: jest.fn(),
      vertexAttribPointer: jest.fn(),
      enableVertexAttribArray: jest.fn(),
      drawArrays: jest.fn(),
      createTexture: jest.fn(() => ({})),
      bindTexture: jest.fn(),
      texImage2D: jest.fn(),
      texParameteri: jest.fn(),
      activeTexture: jest.fn(),
      blendFunc: jest.fn(),
      depthFunc: jest.fn(),
      cullFace: jest.fn(),
      frontFace: jest.fn(),
      lineWidth: jest.fn(),
      polygonOffset: jest.fn(),
      scissor: jest.fn(),
      drawElements: jest.fn(),
      createFramebuffer: jest.fn(() => ({})),
      framebufferTexture2D: jest.fn(),
      bindFramebuffer: jest.fn(),
      readPixels: jest.fn(),
      canvas: { width: 800, height: 600 },
    };
  }
  if (contextType === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '10px sans-serif',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      measureText: jest.fn(() => ({ width: 100 })),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      })),
      setTransform: jest.fn(),
      resetTransform: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      translate: jest.fn(),
      transform: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
      createPattern: jest.fn(() => ({})),
      drawImage: jest.fn(),
      clip: jest.fn(),
      isPointInPath: jest.fn(() => false),
      canvas: { width: 800, height: 600 },
    };
  }
  return null;
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
  })
);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock Worker
class WorkerMock {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = null;
  }
  postMessage(msg) {
    // Simulate async message response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: { type: 'test', payload: msg } });
      }
    }, 0);
  }
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

global.Worker = WorkerMock;
window.Worker = WorkerMock;

// Mock URL.createObjectURL
window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
window.URL.revokeObjectURL = jest.fn();

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented') ||
       args[0].includes('ReactDOM.render') ||
       args[0].includes('Warning:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
       args[0].includes('componentWillMount'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
