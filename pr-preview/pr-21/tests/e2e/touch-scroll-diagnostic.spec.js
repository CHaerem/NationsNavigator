import { test, expect } from '@playwright/test';

test.describe('Touch Scroll Diagnostic Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: false,
        value: 5,
      });
      
      Object.defineProperty(window, 'ontouchstart', {
        writable: false,
        value: {},
      });
      
      // Add scroll debugging
      window.scrollDebug = {
        events: [],
        elements: {}
      };
      
      // Monitor all scroll events
      document.addEventListener('scroll', (e) => {
        window.scrollDebug.events.push({
          type: 'scroll',
          target: e.target.id || e.target.className || e.target.tagName,
          timestamp: Date.now()
        });
      }, true);
      
      // Monitor touch events
      document.addEventListener('touchstart', (e) => {
        window.scrollDebug.events.push({
          type: 'touchstart',
          target: e.target.id || e.target.className || e.target.tagName,
          timestamp: Date.now()
        });
      }, true);
      
      document.addEventListener('touchmove', (e) => {
        window.scrollDebug.events.push({
          type: 'touchmove',
          target: e.target.id || e.target.className || e.target.tagName,
          timestamp: Date.now()
        });
      }, true);
    });
    
    await page.goto('/');
    await page.waitForSelector('#map');
    await page.waitForFunction(() => window.map && window.map._loaded);
  });

  test('should diagnose country info panel scroll behavior', async ({ page }) => {
    console.log('=== COUNTRY INFO PANEL SCROLL DIAGNOSTIC ===');
    
    // First trigger country selection to populate content
    await page.touchscreen.tap(200, 300);
    await page.waitForTimeout(1000);
    
    // Wait for panel to be visible
    await page.waitForSelector('#info-panel', { state: 'visible' });
    
    // Get detailed information about the panel and its content
    const panelInfo = await page.evaluate(() => {
      const panel = document.getElementById('info-panel');
      const content = panel?.querySelector('.panel-content');
      const countryInfo = document.getElementById('country-info');
      const message = document.getElementById('message');
      
      if (!panel || !content) {
        return { error: 'Panel or content not found' };
      }
      
      const panelStyle = window.getComputedStyle(panel);
      const contentStyle = window.getComputedStyle(content);
      
      return {
        panel: {
          id: panel.id,
          classes: panel.className,
          bounds: panel.getBoundingClientRect(),
          style: {
            position: panelStyle.position,
            overflow: panelStyle.overflow,
            overflowY: panelStyle.overflowY,
            touchAction: panelStyle.touchAction,
            pointerEvents: panelStyle.pointerEvents,
            userSelect: panelStyle.userSelect,
            webkitUserSelect: panelStyle.webkitUserSelect
          }
        },
        content: {
          classes: content.className,
          bounds: content.getBoundingClientRect(),
          scrollHeight: content.scrollHeight,
          clientHeight: content.clientHeight,
          scrollTop: content.scrollTop,
          isScrollable: content.scrollHeight > content.clientHeight,
          style: {
            overflow: contentStyle.overflow,
            overflowY: contentStyle.overflowY,
            touchAction: contentStyle.touchAction,
            webkitOverflowScrolling: contentStyle.webkitOverflowScrolling,
            pointerEvents: contentStyle.pointerEvents,
            userSelect: contentStyle.userSelect,
            height: contentStyle.height,
            maxHeight: contentStyle.maxHeight
          }
        },
        countryInfo: {
          exists: !!countryInfo,
          innerHTML: countryInfo?.innerHTML?.length || 0,
          scrollHeight: countryInfo?.scrollHeight || 0
        },
        message: {
          exists: !!message,
          innerHTML: message?.innerHTML?.length || 0,
          scrollHeight: message?.scrollHeight || 0
        }
      };
    });
    
    console.log('Panel diagnostic info:', JSON.stringify(panelInfo, null, 2));
    
    // Test if content is actually scrollable
    if (panelInfo.content?.isScrollable) {
      console.log('Content is scrollable, testing scroll behavior...');
      
      const contentSelector = '#info-panel .panel-content';
      const contentElement = page.locator(contentSelector);
      const contentBox = await contentElement.boundingBox();
      
      if (contentBox) {
        // Clear previous scroll events
        await page.evaluate(() => { window.scrollDebug.events = []; });
        
        // Test different scroll methods
        console.log('Testing Method 1: Touch drag');
        await page.touchscreen.tap(contentBox.x + contentBox.width/2, contentBox.y + contentBox.height/2);
        await page.mouse.move(contentBox.x + contentBox.width/2, contentBox.y + contentBox.height * 0.8);
        await page.mouse.down();
        await page.mouse.move(contentBox.x + contentBox.width/2, contentBox.y + contentBox.height * 0.2, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(500);
        
        let scrollEvents1 = await page.evaluate(() => window.scrollDebug.events.filter(e => e.type === 'scroll'));
        console.log('Scroll events after drag:', scrollEvents1.length);
        
        // Test Method 2: Direct wheel event
        console.log('Testing Method 2: Wheel event');
        await page.evaluate(() => { window.scrollDebug.events = []; });
        await contentElement.hover();
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(500);
        
        let scrollEvents2 = await page.evaluate(() => window.scrollDebug.events.filter(e => e.type === 'scroll'));
        console.log('Scroll events after wheel:', scrollEvents2.length);
        
        // Test Method 3: Programmatic scroll
        console.log('Testing Method 3: Programmatic scroll');
        const initialScrollTop = await contentElement.evaluate(el => el.scrollTop);
        await contentElement.evaluate(el => el.scrollTop = 50);
        await page.waitForTimeout(500);
        const newScrollTop = await contentElement.evaluate(el => el.scrollTop);
        
        console.log(`Programmatic scroll: ${initialScrollTop} -> ${newScrollTop}`);
        
        // Get final scroll state
        const finalPanelInfo = await page.evaluate(() => {
          const content = document.querySelector('#info-panel .panel-content');
          return {
            scrollTop: content?.scrollTop || 0,
            scrollHeight: content?.scrollHeight || 0,
            clientHeight: content?.clientHeight || 0
          };
        });
        
        console.log('Final scroll state:', finalPanelInfo);
        
        // Collect all debug events
        const allEvents = await page.evaluate(() => window.scrollDebug.events);
        console.log('All touch/scroll events:', allEvents);
        
        // Verify scroll worked
        if (newScrollTop > initialScrollTop) {
          console.log('✅ Programmatic scroll worked');
        } else {
          console.log('❌ Programmatic scroll failed');
        }
        
      } else {
        console.log('❌ Could not get content bounding box');
      }
    } else {
      console.log('❌ Content is not scrollable - not enough content or CSS issue');
      
      // Add more content to test scrolling
      await page.evaluate(() => {
        const countryInfo = document.getElementById('country-info');
        if (countryInfo) {
          countryInfo.innerHTML += '<br>'.repeat(50) + '<div>Extra content for testing scroll...</div>';
        }
      });
      
      await page.waitForTimeout(500);
      
      // Re-test after adding content
      const updatedInfo = await page.evaluate(() => {
        const content = document.querySelector('#info-panel .panel-content');
        return {
          scrollHeight: content?.scrollHeight || 0,
          clientHeight: content?.clientHeight || 0,
          isScrollable: content ? content.scrollHeight > content.clientHeight : false
        };
      });
      
      console.log('After adding content:', updatedInfo);
      
      if (updatedInfo.isScrollable) {
        console.log('Now content is scrollable, testing again...');
        // Repeat scroll test with new content
        const contentElement = page.locator('#info-panel .panel-content');
        const initialScrollTop = await contentElement.evaluate(el => el.scrollTop);
        await contentElement.evaluate(el => el.scrollTop = 50);
        const newScrollTop = await contentElement.evaluate(el => el.scrollTop);
        
        console.log(`After adding content - scroll: ${initialScrollTop} -> ${newScrollTop}`);
      }
    }
  });

  test('should diagnose CSS and style conflicts', async ({ page }) => {
    console.log('=== CSS STYLE DIAGNOSTIC ===');
    
    // Select country to open panel
    await page.touchscreen.tap(200, 300);
    await page.waitForTimeout(1000);
    
    // Get all CSS rules affecting the panel and content
    const cssInfo = await page.evaluate(() => {
      const panel = document.getElementById('info-panel');
      const content = panel?.querySelector('.panel-content');
      
      if (!panel || !content) return { error: 'Elements not found' };
      
      // Get computed styles for all relevant elements
      const getComputedStyles = (element, properties) => {
        const style = window.getComputedStyle(element);
        const result = {};
        properties.forEach(prop => {
          result[prop] = style.getPropertyValue(prop);
        });
        return result;
      };
      
      const relevantProps = [
        'overflow', 'overflow-x', 'overflow-y',
        'touch-action', '-webkit-overflow-scrolling',
        'pointer-events', 'user-select', '-webkit-user-select',
        'position', 'height', 'max-height', 'min-height',
        'overscroll-behavior', 'scroll-behavior'
      ];
      
      return {
        panel: {
          tag: panel.tagName,
          id: panel.id,
          classes: panel.className.split(' '),
          styles: getComputedStyles(panel, relevantProps)
        },
        content: {
          tag: content.tagName,
          classes: content.className.split(' '),
          styles: getComputedStyles(content, relevantProps)
        },
        // Check parent elements too
        body: {
          styles: getComputedStyles(document.body, ['overflow', 'touch-action', 'pointer-events'])
        },
        html: {
          styles: getComputedStyles(document.documentElement, ['overflow', 'touch-action', 'pointer-events'])
        }
      };
    });
    
    console.log('CSS Diagnostic:', JSON.stringify(cssInfo, null, 2));
    
    // Check for potential conflicts
    const conflicts = [];
    
    if (cssInfo.panel?.styles?.['touch-action'] === 'none') {
      conflicts.push('Panel has touch-action: none which may prevent scrolling');
    }
    
    if (cssInfo.content?.styles?.['overflow-y'] !== 'auto' && cssInfo.content?.styles?.['overflow-y'] !== 'scroll') {
      conflicts.push(`Content overflow-y is ${cssInfo.content?.styles?.['overflow-y']}, should be auto or scroll`);
    }
    
    if (cssInfo.content?.styles?.['pointer-events'] === 'none') {
      conflicts.push('Content has pointer-events: none which prevents interaction');
    }
    
    console.log('Potential conflicts found:', conflicts);
    
    expect(conflicts.length).toBeLessThan(3); // Allow some issues but not too many
  });

  test('should test scroll behavior with different content lengths', async ({ page }) => {
    console.log('=== CONTENT LENGTH SCROLL TEST ===');
    
    // Test with minimal content
    await page.touchscreen.tap(200, 300);
    await page.waitForTimeout(500);
    
    const testScrollWithContent = async (contentDescription, contentHtml) => {
      console.log(`Testing scroll with: ${contentDescription}`);
      
      // Set content
      await page.evaluate((html) => {
        const countryInfo = document.getElementById('country-info');
        if (countryInfo) {
          countryInfo.innerHTML = html;
        }
      }, contentHtml);
      
      await page.waitForTimeout(300);
      
      // Check scrollability
      const scrollInfo = await page.evaluate(() => {
        const content = document.querySelector('#info-panel .panel-content');
        if (!content) return null;
        
        return {
          scrollHeight: content.scrollHeight,
          clientHeight: content.clientHeight,
          isScrollable: content.scrollHeight > content.clientHeight,
          scrollTop: content.scrollTop
        };
      });
      
      console.log(`${contentDescription} scroll info:`, scrollInfo);
      
      if (scrollInfo?.isScrollable) {
        // Test actual scrolling
        const contentElement = page.locator('#info-panel .panel-content');
        const before = await contentElement.evaluate(el => el.scrollTop);
        await contentElement.evaluate(el => el.scrollTop = Math.min(50, el.scrollHeight - el.clientHeight));
        const after = await contentElement.evaluate(el => el.scrollTop);
        
        console.log(`${contentDescription} scroll test: ${before} -> ${after}`);
        return after > before;
      }
      
      return false;
    };
    
    // Test cases
    const testCases = [
      {
        description: 'Short content',
        html: '<h3>Country Name</h3><p>Short description</p>'
      },
      {
        description: 'Medium content', 
        html: '<h3>Country Name</h3>' + '<p>Medium length description. '.repeat(10) + '</p>'
      },
      {
        description: 'Long content',
        html: '<h3>Country Name</h3>' + '<p>Very long description with lots of text. '.repeat(50) + '</p>' + '<div>Additional info</div>'.repeat(20)
      }
    ];
    
    const results = [];
    for (const testCase of testCases) {
      const scrollWorked = await testScrollWithContent(testCase.description, testCase.html);
      results.push({ ...testCase, scrollWorked });
    }
    
    console.log('Scroll test results:', results);
    
    // At least the long content should be scrollable
    const longContentResult = results.find(r => r.description === 'Long content');
    expect(longContentResult?.scrollWorked).toBe(true);
  });

  test('should test touch event propagation', async ({ page }) => {
    console.log('=== TOUCH EVENT PROPAGATION TEST ===');
    
    // Add event listeners to track propagation
    await page.addInitScript(() => {
      window.touchEventLog = [];
      
      const logEvent = (e, phase) => {
        window.touchEventLog.push({
          type: e.type,
          target: e.target.id || e.target.className || e.target.tagName,
          phase: phase,
          defaultPrevented: e.defaultPrevented,
          timestamp: Date.now()
        });
      };
      
      // Add listeners to different elements
      ['touchstart', 'touchmove', 'touchend'].forEach(eventType => {
        document.body.addEventListener(eventType, (e) => logEvent(e, 'body'), true);
        document.addEventListener(eventType, (e) => logEvent(e, 'document'), true);
      });
    });
    
    await page.touchscreen.tap(200, 300);
    await page.waitForTimeout(1000);
    
    // Clear log and test touch on panel content
    await page.evaluate(() => { window.touchEventLog = []; });
    
    const panelContent = page.locator('#info-panel .panel-content');
    if (await panelContent.isVisible()) {
      const contentBox = await panelContent.boundingBox();
      if (contentBox) {
        // Perform touch sequence
        await page.touchscreen.tap(contentBox.x + contentBox.width/2, contentBox.y + contentBox.height/2);
        await page.waitForTimeout(300);
        
        // Get event log
        const eventLog = await page.evaluate(() => window.touchEventLog);
        console.log('Touch event propagation:', eventLog);
        
        // Check if events are being prevented inappropriately
        const preventedEvents = eventLog.filter(e => e.defaultPrevented);
        if (preventedEvents.length > 0) {
          console.log('Events being prevented:', preventedEvents);
        }
      }
    }
  });
});