import React, { useEffect, useRef, useCallback } from 'react';

/**
 * WebGL Context Manager Component
 * 
 * This component helps manage WebGL contexts to prevent the 
 * "Too many active WebGL contexts" warning by ensuring proper cleanup.
 */

// ✅ FIXED: Create a singleton instance for global context tracking
const globalContextManager = {
  activeContexts: new Set(),
  maxContexts: 16, // Browser limit
  
  registerContext(contextId, contextType = 'unknown') {
    this.activeContexts.add({ id: contextId, type: contextType, created: Date.now() });
    
    console.log(`🎮 WebGL Context registered: ${contextId} (${contextType})`);
    console.log(`📊 Active contexts: ${this.activeContexts.size}/${this.maxContexts}`);
    
    if (this.activeContexts.size > this.maxContexts * 0.8) {
      console.warn('⚠️ Approaching WebGL context limit!', {
        active: this.activeContexts.size,
        max: this.maxContexts,
        contexts: Array.from(this.activeContexts)
      });
    }
  },
  
  unregisterContext(contextId) {
    const contextToRemove = Array.from(this.activeContexts).find(ctx => ctx.id === contextId);
    if (contextToRemove) {
      this.activeContexts.delete(contextToRemove);
      console.log(`🗑️ WebGL Context unregistered: ${contextId}`);
      console.log(`📊 Active contexts: ${this.activeContexts.size}/${this.maxContexts}`);
    }
  },
  
  forceCleanupOldContexts() {
    const now = Date.now();
    const oldContexts = Array.from(this.activeContexts).filter(
      ctx => {
        // ✅ NEW: Never clean up heatmap contexts
        if (ctx.type === 'heatmap') {
          return false;
        }
        return now - ctx.created > 30000 // 30 seconds old
      }
    );
    
    oldContexts.forEach(ctx => {
      this.activeContexts.delete(ctx);
      console.log(`🧹 Force cleaned old context: ${ctx.id} (${ctx.type})`);
    });
    
    return oldContexts.length;
  },
  
  getActiveCount() {
    return this.activeContexts.size;
  },
  
  // ✅ NEW: Manually register a context (for external libraries like DeckGL)
  registerExternalContext(contextType = 'external', sessionId = null) {
    let contextId;
    
    if (sessionId) {
      // Use predictable session-based IDs
      contextId = `${sessionId}_${contextType}`;
    } else {
      // Fallback to random ID for backward compatibility
      contextId = `external_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    this.registerContext(contextId, contextType);
    return contextId;
  },
  
  // ✅ NEW: Force cleanup ALL contexts except the specified ones
  forceCleanupExcept(keepContextIds = []) {
    const contextsToRemove = Array.from(this.activeContexts).filter(
      ctx => !keepContextIds.includes(ctx.id)
    );
    
    contextsToRemove.forEach(ctx => {
      this.activeContexts.delete(ctx);
      console.log(`🧹 Force cleaned context: ${ctx.id} (${ctx.type})`);
    });
    
    return contextsToRemove.length;
  },
  
  // ✅ NEW: Get all active context IDs
  getActiveContextIds() {
    return Array.from(this.activeContexts).map(ctx => ctx.id);
  }
};

export const useWebGLContextManager = () => {
  // ✅ FIXED: Return the singleton instance methods
  return {
    registerContext: globalContextManager.registerContext.bind(globalContextManager),
    unregisterContext: globalContextManager.unregisterContext.bind(globalContextManager),
    forceCleanupOldContexts: globalContextManager.forceCleanupOldContexts.bind(globalContextManager),
    getActiveCount: globalContextManager.getActiveCount.bind(globalContextManager),
    registerExternalContext: globalContextManager.registerExternalContext.bind(globalContextManager),
    forceCleanupExcept: globalContextManager.forceCleanupExcept.bind(globalContextManager),
    getActiveContextIds: globalContextManager.getActiveContextIds.bind(globalContextManager)
  };
};

/**
 * Simple Sigma Container with WebGL cleanup (non-intrusive)
 */
export const SigmaContainerWithCleanup = ({ children, onContextCreate, onContextDestroy, sessionId = null, contextType = 'sigma', ...props }) => {
  const contextId = useRef((() => {
    if (sessionId) {
      return `${sessionId}_${contextType}`;
    }
    return `sigma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  })());
  const { registerContext, unregisterContext } = useWebGLContextManager();

  useEffect(() => {
    // Register context
    registerContext(contextId.current, contextType);
    onContextCreate?.(contextId.current);

    // Cleanup function runs when component unmounts
    return () => {
      console.log('🧹 Sigma cleanup - unregistering context:', contextId.current);
      unregisterContext(contextId.current);
      onContextDestroy?.(contextId.current);
    };
  }, [registerContext, unregisterContext, onContextCreate, onContextDestroy]);

  // ✅ FIXED: Just render children without interfering with Sigma.js
  return <>{children}</>;
};

/**
 * Enhanced Three.js container with WebGL cleanup
 */
export const ThreeJSContainerWithCleanup = ({ children, onContextCreate, onContextDestroy, sessionId = null, contextType = 'threejs' }) => {
  const contextId = useRef((() => {
    if (sessionId) {
      return `${sessionId}_${contextType}`;
    }
    return `threejs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  })());
  const { registerContext, unregisterContext } = useWebGLContextManager();

  useEffect(() => {
    registerContext(contextId.current, contextType);
    onContextCreate?.(contextId.current);

    return () => {
      unregisterContext(contextId.current);
      onContextDestroy?.(contextId.current);
    };
  }, [registerContext, unregisterContext, onContextCreate, onContextDestroy]);

  return <>{children}</>;
};

/**
 * ✅ NEW: WebGL Context Interceptor
 * This intercepts WebGL context creation to track all contexts
 */
export const WebGLContextInterceptor = () => {
  const { registerContext, unregisterContext, getActiveCount } = useWebGLContextManager();
  
  useEffect(() => {
    // Store original methods
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    
    // Track active contexts
    const activeCanvases = new WeakSet();
    
    // Intercept canvas.getContext
    HTMLCanvasElement.prototype.getContext = function(contextType, ...args) {
      // ✅ NEW: Check context count BEFORE creating new context
      if (contextType === 'webgl' || contextType === 'experimental-webgl' || contextType === 'webgl2') {
        const currentCount = getActiveCount();
        
        // If we're already at the limit, prevent new context creation
        if (currentCount >= 8) {
          console.warn('🚫 BLOCKING new WebGL context creation - too many active contexts');
          
          // Force immediate cleanup of old contexts
          const contextsToRemove = Array.from(globalContextManager.activeContexts).filter(
            ctx => ctx.type === 'intercepted'
          );
          
          contextsToRemove.forEach(ctx => {
            globalContextManager.activeContexts.delete(ctx);
            console.log(`🧹 Preemptive cleanup: removed ${ctx.id} (${ctx.type})`);
          });
          
          console.log(`🧹 Preemptive cleanup complete. Remaining contexts: ${getActiveCount()}`);
        }
      }
      
      const context = originalGetContext.call(this, contextType, ...args);
      
      if (context && (contextType === 'webgl' || contextType === 'experimental-webgl' || contextType === 'webgl2') && !activeCanvases.has(this)) {
        activeCanvases.add(this);
        const contextId = `intercepted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        registerContext(contextId, 'intercepted');
        
        // Store context ID on canvas for cleanup
        this._webglContextId = contextId;
        
        // Monitor for context loss
        const handleContextLost = () => {
          if (this._webglContextId) {
            unregisterContext(this._webglContextId);
            this._webglContextId = null;
          }
        };
        
        this.addEventListener('webglcontextlost', handleContextLost);
        
        console.log('🎮 WebGL context intercepted:', contextId, `(Total: ${getActiveCount()})`);
      }
      
      return context;
    };
    
    return () => {
      // Restore original methods
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    };
  }, [registerContext, unregisterContext, getActiveCount]);
  
  return null;
};

/**
 * WebGL Context Monitor - displays current context count
 */
export const WebGLContextMonitor = () => {
  const { getActiveCount, forceCleanupOldContexts } = useWebGLContextManager();
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    const updateCount = () => setCount(getActiveCount());
    const interval = setInterval(updateCount, 1000);
    updateCount(); // Initial update
    
    return () => clearInterval(interval);
  }, [getActiveCount]);

  const handleForceCleanup = () => {
    const cleaned = forceCleanupOldContexts();
    console.log(`🧹 Force cleaned ${cleaned} old contexts`);
    
    // Also try to trigger garbage collection
    if (window.gc) {
      window.gc();
      console.log('🗑️ Garbage collection triggered');
    }
  };

  if (count === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: count > 12 ? '#ff5722' : count > 8 ? '#ff9800' : '#4caf50',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 10000,
      cursor: 'pointer'
    }} onClick={handleForceCleanup} title="Click to force cleanup old contexts">
      🎮 WebGL: {count}/16
    </div>
  );
}; 