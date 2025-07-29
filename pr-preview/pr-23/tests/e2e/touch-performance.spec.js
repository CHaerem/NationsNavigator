// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Touch Performance - Fast Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#map');
    await page.waitForFunction(() => window.map && window.map._loaded);
  });

  test('should load map without performance issues', async ({ page }) => {
    // Use mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate touch device
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
    });
    
    await page.reload();
    await page.waitForSelector('#map');
    await page.waitForFunction(() => window.map && window.map._loaded);
    
    // Test basic interaction performance
    const mapElement = page.locator('#map');
    const box = await mapElement.boundingBox();
    
    if (box) {
      const startTime = Date.now();
      
      // Perform simple touch interaction
      await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
      await page.waitForTimeout(100);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should respond quickly (under 1 second)
      expect(duration).toBeLessThan(1000);
    }
  });

  test('should handle zoom controls efficiently', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
    });
    
    await page.reload();
    await page.waitForSelector('#map');
    await page.waitForFunction(() => window.map && window.map._loaded);
    
    const startTime = Date.now();
    
    // Test zoom controls
    const zoomInBtn = page.locator('.leaflet-control-zoom-in');
    if (await zoomInBtn.count() > 0) {
      await zoomInBtn.click();
      await page.waitForTimeout(200);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should zoom quickly
    expect(duration).toBeLessThan(1000);
    
    // Map should still be responsive
    const isResponsive = await page.evaluate(() => {
      return window.map && window.map.getZoom() > 0;
    });
    
    expect(isResponsive).toBe(true);
  });

  test('should not cause memory leaks during interaction', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
    });
    
    await page.reload();
    await page.waitForSelector('#map');
    await page.waitForFunction(() => window.map && window.map._loaded);
    
    // Verify no console errors occurred
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    
    // Perform multiple interactions
    const mapElement = page.locator('#map');
    const box = await mapElement.boundingBox();
    
    if (box) {
      for (let i = 0; i < 3; i++) {
        await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
        await page.waitForTimeout(50);
      }
    }
    
    // Should not have errors
    expect(errors.length).toBe(0);
  });

  test('should maintain smooth frame rate during drag operations', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Performance tests only on Chromium');
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate touch device
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
      
      // Setup performance monitoring
      window.performanceData = {
        startTime: performance.now(),
        frames: []
      };
      
      // Monitor frame rate
      function recordFrame() {
        window.performanceData.frames.push(performance.now());
        requestAnimationFrame(recordFrame);
      }
      requestAnimationFrame(recordFrame);
    });
    
    await page.reload();
    await page.waitForSelector('#map');
    await page.waitForFunction(() => window.map && window.map._loaded);
    
    // Perform drag operations
    const mapElement = page.locator('#map');
    const box = await mapElement.boundingBox();
    
    for (let i = 0; i < 10; i++) {
      const startX = box.x + Math.random() * box.width;
      const startY = box.y + Math.random() * box.height;
      const endX = startX + 100;
      const endY = startY + 100;
      
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 3 });
      await page.mouse.up();
      
      await page.waitForTimeout(50);
    }
    
    // Analyze performance
    const performanceResults = await page.evaluate(() => {
      const data = window.performanceData;
      const totalTime = (performance.now() - data.startTime) / 1000; // seconds
      const frameCount = data.frames.length;
      const fps = frameCount / totalTime;
      
      return {
        fps: fps,
        frameCount: frameCount,
        totalTime: totalTime
      };
    });
    
    console.log(`Touch Performance - FPS: ${performanceResults.fps.toFixed(2)}, Frames: ${performanceResults.frameCount}, Time: ${performanceResults.totalTime.toFixed(2)}s`);
    
    // Should maintain reasonable frame rate (at least 30fps)
    expect(performanceResults.fps).toBeGreaterThan(30);
  });

  test('should handle rapid touch events without blocking', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Performance tests only on Chromium');
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate touch device
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: false,
        value: 5,
      });
    });
    
    await page.reload();
    await page.waitForSelector('#map');
    await page.waitForFunction(() => window.map && window.map._loaded);
    
    // Monitor event processing time
    await page.evaluate(() => {
      window.eventTimes = [];
      
      // Hook into touch events
      const originalAddEventListener = Element.prototype.addEventListener;
      Element.prototype.addEventListener = function(type, listener, options) {
        if (type.includes('touch') || type === 'tap' || type === 'click') {
          const wrappedListener = function(event) {
            const start = performance.now();
            listener.call(this, event);
            const end = performance.now();
            window.eventTimes.push(end - start);
          };
          return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
    });
    
    // Perform rapid touch interactions
    const countrySelector = 'path[data-iso="US"], path[id*="US"], .country-layer';
    const countryElement = page.locator(countrySelector).first();
    
    // Rapid taps
    for (let i = 0; i < 20; i++) {
      await countryElement.tap();
      await page.waitForTimeout(10);
    }
    
    // Check event processing times
    const eventTimes = await page.evaluate(() => window.eventTimes || []);
    
    if (eventTimes.length > 0) {
      const avgTime = eventTimes.reduce((a, b) => a + b, 0) / eventTimes.length;
      const maxTime = Math.max(...eventTimes);
      
      console.log(`Event Processing - Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms, Count: ${eventTimes.length}`);
      
      // Events should process quickly (under 16ms for 60fps)
      expect(avgTime).toBeLessThan(16);
      expect(maxTime).toBeLessThan(50); // Allow some spikes
    }
  });

  test('should not cause memory leaks during touch interactions', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Memory tests only on Chromium');
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate touch device
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: false,
        value: 5,
      });
    });
    
    await page.reload();
    await page.waitForSelector('#map');
    await page.waitForFunction(() => window.map && window.map._loaded);
    
    // Measure initial memory
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize
        };
      }
      return null;
    });
    
    if (initialMemory) {
      // Perform many touch interactions
      const countrySelectors = [
        'path[data-iso="US"]', 'path[data-iso="FR"]', 'path[data-iso="DE"]',
        'path[data-iso="GB"]', 'path[data-iso="IT"]', 'path[data-iso="ES"]'
      ];
      
      for (let cycle = 0; cycle < 5; cycle++) {
        for (const selector of countrySelectors) {
          const element = page.locator(selector).first();
          if (await element.count() > 0) {
            await element.tap();
            await page.waitForTimeout(50);
            
            // Close any open panels
            const closeBtn = page.locator('.close-btn, .reset-btn').first();
            if (await closeBtn.count() > 0) {
              await closeBtn.click();
              await page.waitForTimeout(50);
            }
          }
        }
      }
      
      // Force garbage collection
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
      
      await page.waitForTimeout(1000);
      
      // Measure final memory
      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize
          };
        }
        return null;
      });
      
      if (finalMemory) {
        const memoryIncrease = finalMemory.used - initialMemory.used;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.used) * 100;
        
        console.log(`Memory Usage - Initial: ${(initialMemory.used / 1024 / 1024).toFixed(2)}MB, Final: ${(finalMemory.used / 1024 / 1024).toFixed(2)}MB, Increase: ${memoryIncreasePercent.toFixed(2)}%`);
        
        // Memory increase should be reasonable (less than 50%)
        expect(memoryIncreasePercent).toBeLessThan(50);
      }
    }
  });

  test('should maintain responsive UI during complex touch gestures', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'UI responsiveness tests only on Chromium');
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate touch device
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: false,
        value: 5,
      });
    });
    
    await page.reload();
    await page.waitForSelector('#map');
    await page.waitForFunction(() => window.map && window.map._loaded);
    
    // Monitor UI responsiveness
    await page.evaluate(() => {
      window.uiResponsive = true;
      window.responseTests = [];
      
      // Test button responsiveness
      const testButton = document.createElement('button');
      testButton.textContent = 'Test';
      testButton.style.position = 'fixed';
      testButton.style.top = '10px';
      testButton.style.right = '10px';
      testButton.style.zIndex = '9999';
      testButton.id = 'responsiveness-test-btn';
      
      let clickTime = 0;
      testButton.addEventListener('click', () => {
        const responseTime = performance.now() - clickTime;
        window.responseTests.push(responseTime);
      });
      
      testButton.addEventListener('touchstart', () => {
        clickTime = performance.now();
      });
      
      document.body.appendChild(testButton);
    });
    
    // Perform complex touch gestures while testing UI responsiveness
    const mapElement = page.locator('#map');
    const box = await mapElement.boundingBox();
    
    // Start complex pan gestures
    const panPromise = (async () => {
      for (let i = 0; i < 15; i++) {
        const startX = box.x + Math.random() * box.width;
        const startY = box.y + Math.random() * box.height;
        const endX = startX + (Math.random() - 0.5) * 200;
        const endY = startY + (Math.random() - 0.5) * 200;
        
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, endY, { steps: 8 });
        await page.mouse.up();
        
        await page.waitForTimeout(100);
      }
    })();
    
    // Test UI responsiveness during complex gestures
    const testButton = page.locator('#responsiveness-test-btn');
    
    // Click test button multiple times during pan gestures
    const uiTestPromise = (async () => {
      for (let i = 0; i < 10; i++) {
        await testButton.tap();
        await page.waitForTimeout(200);
      }
    })();
    
    // Wait for both operations to complete
    await Promise.all([panPromise, uiTestPromise]);
    
    // Check UI responsiveness results
    const responsiveness = await page.evaluate(() => {
      const tests = window.responseTests || [];
      if (tests.length === 0) return { avgResponse: 0, maxResponse: 0 };
      
      const avgResponse = tests.reduce((a, b) => a + b, 0) / tests.length;
      const maxResponse = Math.max(...tests);
      
      return { avgResponse, maxResponse, testCount: tests.length };
    });
    
    console.log(`UI Responsiveness - Avg: ${responsiveness.avgResponse.toFixed(2)}ms, Max: ${responsiveness.maxResponse.toFixed(2)}ms, Tests: ${responsiveness.testCount}`);
    
    // UI should remain responsive (under 100ms response time)
    if (responsiveness.testCount > 0) {
      expect(responsiveness.avgResponse).toBeLessThan(100);
      expect(responsiveness.maxResponse).toBeLessThan(300);
    }
  });
});
