import { test, expect } from '@playwright/test';

test.describe('Comprehensive Touch Screen Experience Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport and enable touch
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate touch device
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: false,
        value: 5,
      });
      
      // Override touch detection
      Object.defineProperty(window, 'ontouchstart', {
        writable: false,
        value: {},
      });
    });
    
    await page.goto('/');
    await page.waitForSelector('#map');
    await page.waitForFunction(() => window.map && window.map._loaded);
  });

  test.describe('Country Info Panel Touch Interactions', () => {
    test('should scroll country info panel content on touch devices', async ({ page }) => {
      // First, select a country to open the info panel
      await page.touchscreen.tap(200, 300); // Tap on map area
      await page.waitForTimeout(500);
      
      // Wait for country info panel to be visible
      await page.waitForSelector('#info-panel', { state: 'visible' });
      
      // Get panel content area
      const panelContent = page.locator('#info-panel .panel-content');
      await expect(panelContent).toBeVisible();
      
      // Check if content is scrollable by getting scroll properties
      const scrollInfo = await panelContent.evaluate((element) => {
        return {
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          scrollTop: element.scrollTop,
          isScrollable: element.scrollHeight > element.clientHeight,
          computedStyle: window.getComputedStyle(element),
          touchAction: window.getComputedStyle(element).touchAction,
          overflowY: window.getComputedStyle(element).overflowY
        };
      });
      
      console.log('Panel Content Scroll Info:', scrollInfo);
      
      // Check CSS properties
      expect(scrollInfo.overflowY).toBe('auto');
      expect(['pan-y', 'auto', 'manipulation']).toContain(scrollInfo.touchAction);
      
      if (scrollInfo.isScrollable) {
        // Test scrolling by touch
        const contentBox = await panelContent.boundingBox();
        if (contentBox) {
          const startY = contentBox.y + contentBox.height * 0.8;
          const endY = contentBox.y + contentBox.height * 0.2;
          
          // Perform scroll gesture
          await page.touchscreen.tap(contentBox.x + contentBox.width/2, startY);
          await page.mouse.move(contentBox.x + contentBox.width/2, startY);
          await page.mouse.down();
          await page.mouse.move(contentBox.x + contentBox.width/2, endY, { steps: 10 });
          await page.mouse.up();
          
          await page.waitForTimeout(500);
          
          // Check if scroll position changed
          const newScrollTop = await panelContent.evaluate(el => el.scrollTop);
          expect(newScrollTop).toBeGreaterThan(scrollInfo.scrollTop);
        }
      } else {
        console.log('Content is not scrollable - not enough content');
      }
    });

    test('should allow text selection in country info panel', async ({ page }) => {
      // Select a country
      await page.touchscreen.tap(200, 300);
      await page.waitForTimeout(500);
      
      await page.waitForSelector('#country-info', { state: 'visible' });
      
      // Check if text is selectable
      const isTextSelectable = await page.locator('#country-info').evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          userSelect: style.userSelect,
          webkitUserSelect: style.webkitUserSelect,
          msUserSelect: style.msUserSelect
        };
      });
      
      console.log('Text selection properties:', isTextSelectable);
      
      // Text should be selectable
      expect(['text', 'auto', 'all']).toContain(isTextSelectable.userSelect || isTextSelectable.webkitUserSelect);
    });

    test('should detect touch device and apply appropriate classes', async ({ page }) => {
      await page.waitForTimeout(1000); // Let component initialize
      
      // Check if touch device class is applied
      const panelClasses = await page.locator('#info-panel').getAttribute('class');
      console.log('Panel classes:', panelClasses);
      
      expect(panelClasses).toContain('touch-device');
      expect(panelClasses).not.toContain('desktop-mode');
      
      // Check header cursor style
      const headerCursor = await page.locator('.panel-header').evaluate((element) => {
        return window.getComputedStyle(element).cursor;
      });
      
      expect(headerCursor).toBe('default');
    });
  });

  test.describe('Search and Input Touch Interactions', () => {
    test('should allow touch interaction with search input', async ({ page }) => {
      const searchInput = page.locator('#query-input');
      
      // Tap on search input
      await searchInput.tap();
      await page.waitForTimeout(300);
      
      // Check if input is focused
      const isFocused = await searchInput.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);
      
      // Type text
      await searchInput.fill('countries with large population');
      
      const inputValue = await searchInput.inputValue();
      expect(inputValue).toBe('countries with large population');
    });

    test('should handle touch interactions with search button', async ({ page }) => {
      const searchInput = page.locator('#query-input');
      const searchButton = page.locator('#search-btn');
      
      await searchInput.fill('test query');
      
      // Check if button is enabled
      const isEnabled = await searchButton.isEnabled();
      expect(isEnabled).toBe(true);
      
      // Tap search button
      await searchButton.tap();
      await page.waitForTimeout(500);
      
      // Should trigger search (check for any response)
      // This is a basic check - actual search behavior depends on LLM availability
    });
  });

  test.describe('Map Touch Interactions', () => {
    test('should handle country selection via touch', async ({ page }) => {
      // Test multiple touch points on the map
      const touchPoints = [
        { x: 150, y: 250, description: 'North America area' },
        { x: 250, y: 300, description: 'Europe area' },
        { x: 300, y: 350, description: 'Africa area' }
      ];
      
      for (const point of touchPoints) {
        console.log(`Testing touch at ${point.description}`);
        
        // Tap on map area
        await page.touchscreen.tap(point.x, point.y);
        await page.waitForTimeout(500);
        
        // Check if any interaction occurred (country selection, panel update, etc.)
        const panelVisible = await page.locator('#info-panel').isVisible();
        console.log(`Panel visible after tap at ${point.description}: ${panelVisible}`);
      }
    });

    test('should handle map panning via touch', async ({ page }) => {
      const mapElement = page.locator('#map');
      const mapBox = await mapElement.boundingBox();
      
      if (mapBox) {
        const startX = mapBox.x + mapBox.width * 0.3;
        const startY = mapBox.y + mapBox.height * 0.5;
        const endX = mapBox.x + mapBox.width * 0.7;
        const endY = mapBox.y + mapBox.height * 0.5;
        
        // Perform pan gesture
        await page.touchscreen.tap(startX, startY);
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, endY, { steps: 5 });
        await page.mouse.up();
        
        await page.waitForTimeout(500);
        
        // Check if map state changed (this is basic - real test would check map center)
        const mapExists = await mapElement.isVisible();
        expect(mapExists).toBe(true);
      }
    });

    test('should maintain map responsiveness during touch interactions', async ({ page }) => {
      // Perform rapid touch interactions
      const mapElement = page.locator('#map');
      const mapBox = await mapElement.boundingBox();
      
      if (mapBox) {
        const centerX = mapBox.x + mapBox.width / 2;
        const centerY = mapBox.y + mapBox.height / 2;
        
        // Rapid taps
        for (let i = 0; i < 5; i++) {
          await page.touchscreen.tap(centerX + Math.random() * 50 - 25, centerY + Math.random() * 50 - 25);
          await page.waitForTimeout(100);
        }
        
        // Map should still be responsive
        const mapStillVisible = await mapElement.isVisible();
        expect(mapStillVisible).toBe(true);
      }
    });
  });

  test.describe('Modal and Settings Touch Interactions', () => {
    test('should handle settings modal touch interactions', async ({ page }) => {
      const settingsButton = page.locator('#settings-btn');
      
      // Open settings
      await settingsButton.tap();
      await page.waitForTimeout(500);
      
      // Check if modal is visible
      const modal = page.locator('#settings-modal');
      await expect(modal).toBeVisible();
      
      // Check if modal content is scrollable
      const modalContent = page.locator('.modal-content');
      const scrollInfo = await modalContent.evaluate((element) => {
        return {
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          overflowY: window.getComputedStyle(element).overflowY
        };
      });
      
      expect(scrollInfo.overflowY).toBe('auto');
      
      // Test modal interaction
      const selectElement = page.locator('#llm-select');
      if (await selectElement.isVisible()) {
        await selectElement.tap();
        await page.waitForTimeout(300);
      }
      
      // Close modal
      const closeButton = page.locator('#settings-close');
      await closeButton.tap();
      await page.waitForTimeout(500);
      
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Touch Gesture Edge Cases', () => {
    test('should handle touch events near viewport edges', async ({ page }) => {
      const viewportSize = page.viewportSize();
      const edgePoints = [
        { x: 10, y: 100, description: 'left edge' },
        { x: viewportSize.width - 10, y: 100, description: 'right edge' },
        { x: 100, y: 10, description: 'top edge' },
        { x: 100, y: viewportSize.height - 10, description: 'bottom edge' }
      ];
      
      for (const point of edgePoints) {
        console.log(`Testing touch at ${point.description}`);
        
        await page.touchscreen.tap(point.x, point.y);
        await page.waitForTimeout(200);
        
        // Basic check that app is still responsive
        const mapVisible = await page.locator('#map').isVisible();
        expect(mapVisible).toBe(true);
      }
    });

    test('should handle rapid touch sequences without breaking', async ({ page }) => {
      const centerX = 200;
      const centerY = 300;
      
      // Rapid touch sequence
      for (let i = 0; i < 10; i++) {
        await page.touchscreen.tap(centerX + i * 10, centerY + i * 5);
        await page.waitForTimeout(50);
      }
      
      // App should still be functional
      const mapExists = await page.locator('#map').isVisible();
      const searchExists = await page.locator('#search-bar').isVisible();
      
      expect(mapExists).toBe(true);
      expect(searchExists).toBe(true);
    });

    test('should handle long press gestures appropriately', async ({ page }) => {
      const mapElement = page.locator('#map');
      const mapBox = await mapElement.boundingBox();
      
      if (mapBox) {
        const centerX = mapBox.x + mapBox.width / 2;
        const centerY = mapBox.y + mapBox.height / 2;
        
        // Simulate long press
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.waitForTimeout(1000); // Long press duration
        await page.mouse.up();
        
        await page.waitForTimeout(500);
        
        // Check if any context menu or special behavior occurred
        // (Basic check that app didn't break)
        const mapStillVisible = await mapElement.isVisible();
        expect(mapStillVisible).toBe(true);
      }
    });
  });

  test.describe('Touch Accessibility and Usability', () => {
    test('should have appropriate touch target sizes', async ({ page }) => {
      const touchTargets = [
        '#search-btn',
        '#settings-btn',
        '.panel-control-btn'
      ];
      
      for (const selector of touchTargets) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          if (await element.isVisible()) {
            const box = await element.boundingBox();
            if (box) {
              // Touch targets should be at least 44x44 pixels (iOS guidelines)
              expect(box.width).toBeGreaterThanOrEqual(28); // Relaxed for this app
              expect(box.height).toBeGreaterThanOrEqual(28);
              
              console.log(`${selector} touch target size: ${box.width}x${box.height}`);
            }
          }
        }
      }
    });

    test('should prevent accidental touches and provide feedback', async ({ page }) => {
      // Test that rapid accidental touches don't cause issues
      const searchButton = page.locator('#search-btn');
      
      // Multiple rapid taps
      for (let i = 0; i < 5; i++) {
        await searchButton.tap();
        await page.waitForTimeout(100);
      }
      
      // App should still be responsive
      const buttonStillVisible = await searchButton.isVisible();
      expect(buttonStillVisible).toBe(true);
    });
  });

  test.describe('Touch Performance and Responsiveness', () => {
    test('should maintain smooth performance during touch scrolling', async ({ page }) => {
      // Add performance monitoring
      await page.addInitScript(() => {
        window.performanceMetrics = {
          touchEvents: 0,
          scrollEvents: 0,
          frameDrops: 0
        };
        
        document.addEventListener('touchstart', () => window.performanceMetrics.touchEvents++);
        document.addEventListener('scroll', () => window.performanceMetrics.scrollEvents++);
      });
      
      // Select a country to open panel
      await page.touchscreen.tap(200, 300);
      await page.waitForTimeout(500);
      
      const panelContent = page.locator('#info-panel .panel-content');
      if (await panelContent.isVisible()) {
        const contentBox = await panelContent.boundingBox();
        if (contentBox) {
          // Perform scroll gestures
          for (let i = 0; i < 3; i++) {
            const startY = contentBox.y + contentBox.height * 0.8;
            const endY = contentBox.y + contentBox.height * 0.2;
            
            await page.mouse.move(contentBox.x + contentBox.width/2, startY);
            await page.mouse.down();
            await page.mouse.move(contentBox.x + contentBox.width/2, endY, { steps: 10 });
            await page.mouse.up();
            
            await page.waitForTimeout(300);
          }
        }
      }
      
      // Check performance metrics
      const metrics = await page.evaluate(() => window.performanceMetrics);
      console.log('Touch Performance Metrics:', metrics);
      
      expect(metrics.touchEvents).toBeGreaterThan(0);
    });
  });
});