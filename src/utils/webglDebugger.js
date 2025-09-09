/**
 * WebGL Context Debugger Utility
 * 
 * This utility helps monitor and debug WebGL context issues
 * that cause the "Too many active WebGL contexts" warning.
 */

export class WebGLContextDebugger {
  constructor() {
    this.contexts = new Map();
    this.maxContexts = this.getMaxContexts();
    this.warnings = [];
  }

  /**
   * Get the maximum number of WebGL contexts allowed by the browser
   */
  getMaxContexts() {
    // Browser-specific limits
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome') || userAgent.includes('Edge')) {
      return 16;
    } else if (userAgent.includes('Firefox')) {
      return 8;
    } else if (userAgent.includes('Safari')) {
      return 8;
    }
    return 8; // Default conservative limit
  }

  /**
   * Monitor WebGL context creation (non-intrusive)
   */
  monitorContextCreation() {
    // ✅ FIXED: Only monitor if not already monitoring
    if (this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = true;
    
    // ✅ FIXED: Use a safer approach that doesn't interfere with existing libraries
    const checkForNewContexts = () => {
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        if (!canvas._webglDebuggerChecked) {
          canvas._webglDebuggerChecked = true;
          
          // Check if this canvas has a WebGL context
          try {
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
            if (gl && !canvas._webglDebuggerRegistered) {
              canvas._webglDebuggerRegistered = true;
              const contextId = `webgl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              this.registerContext(contextId, 'webgl', canvas);
            }
          } catch (error) {
            // Ignore errors
          }
        }
      });
    };
    
    // Check periodically for new contexts
    setInterval(checkForNewContexts, 1000);
    
    // Also check when DOM changes
    const observer = new MutationObserver(checkForNewContexts);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Register a WebGL context
   */
  registerContext(id, type, canvas) {
    this.contexts.set(id, {
      id,
      type,
      canvas,
      created: Date.now(),
      stack: new Error().stack
    });

    console.log(`🎮 WebGL Context registered: ${id} (${type})`);
    console.log(`📊 Active contexts: ${this.contexts.size}/${this.maxContexts}`);
    
    if (this.contexts.size > this.maxContexts * 0.8) {
      this.warn(`⚠️ Approaching WebGL context limit! (${this.contexts.size}/${this.maxContexts})`);
    }
    
    if (this.contexts.size >= this.maxContexts) {
      this.warn(`🚨 WebGL context limit reached! (${this.contexts.size}/${this.maxContexts})`);
      this.forceCleanupOldest();
    }
  }

  /**
   * Unregister a WebGL context
   */
  unregisterContext(id) {
    if (this.contexts.has(id)) {
      const context = this.contexts.get(id);
      this.contexts.delete(id);
      
      console.log(`🗑️ WebGL Context unregistered: ${id}`);
      console.log(`📊 Active contexts: ${this.contexts.size}/${this.maxContexts}`);
      
      return context;
    }
    return null;
  }

  /**
   * Force cleanup of oldest contexts
   */
  forceCleanupOldest() {
    const contexts = Array.from(this.contexts.values());
    contexts.sort((a, b) => a.created - b.created);
    
    // Remove oldest 25% of contexts
    const toRemove = Math.ceil(contexts.length * 0.25);
    const removed = contexts.slice(0, toRemove);
    
    removed.forEach(context => {
      this.contexts.delete(context.id);
      console.log(`🧹 Force cleaned old context: ${context.id}`);
      
      // Try to lose the context
      try {
        const gl = context.canvas.getContext('webgl') || context.canvas.getContext('webgl2');
        if (gl) {
          const loseContext = gl.getExtension('WEBGL_lose_context');
          if (loseContext) {
            loseContext.loseContext();
          }
        }
      } catch (error) {
        console.warn('Could not force context loss:', error);
      }
    });
    
    return removed.length;
  }

  /**
   * Get all active contexts
   */
  getActiveContexts() {
    return Array.from(this.contexts.values());
  }

  /**
   * Get context count
   */
  getContextCount() {
    return this.contexts.size;
  }

  /**
   * Log warning
   */
  warn(message) {
    this.warnings.push({
      message,
      timestamp: Date.now(),
      contextCount: this.contexts.size
    });
    console.warn(message);
  }

  /**
   * Get all warnings
   */
  getWarnings() {
    return this.warnings;
  }

  /**
   * Generate debug report
   */
  generateReport() {
    const contexts = this.getActiveContexts();
    const report = {
      timestamp: new Date().toISOString(),
      totalContexts: contexts.length,
      maxContexts: this.maxContexts,
      warnings: this.warnings.length,
      contexts: contexts.map(ctx => ({
        id: ctx.id,
        type: ctx.type,
        age: Date.now() - ctx.created,
        stack: ctx.stack
      })),
      warnings: this.warnings
    };
    
    console.log('📊 WebGL Context Debug Report:', report);
    return report;
  }

  /**
   * Clear all contexts (emergency cleanup)
   */
  emergencyCleanup() {
    const count = this.contexts.size;
    this.contexts.clear();
    console.log(`🚨 Emergency cleanup: removed ${count} contexts`);
    return count;
  }
}

// Create global instance (but don't auto-start monitoring)
if (typeof window !== 'undefined') {
  window.webglDebugger = new WebGLContextDebugger();
  // ✅ FIXED: Don't auto-start monitoring to avoid interfering with DeckGL
  // Call window.webglDebugger.monitorContextCreation() manually if needed
}

export default WebGLContextDebugger; 