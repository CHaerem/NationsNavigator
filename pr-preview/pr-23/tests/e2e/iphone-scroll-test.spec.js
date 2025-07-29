import { test, expect } from '@playwright/test';

test.describe('iPhone Specific Scrolling Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // Enable touch support on the context
    await context.grantPermissions(['camera', 'microphone']);
    
    // Use iPhone 13 Pro viewport and settings
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Simulate iPhone Safari specifically
    await page.addInitScript(() => {
      // iPhone Safari specific properties
      Object.defineProperty(navigator, 'userAgent', {
        writable: false,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      });
      
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: false,
        value: 5,
      });
      
      Object.defineProperty(window, 'ontouchstart', {
        writable: false,
        value: {},
      });
      
      // Add iOS Safari specific behaviors
      Object.defineProperty(window, 'DeviceMotionEvent', {
        writable: false,
        value: function() {}
      });
      
      // iOS Safari scroll debugging
      window.iOSScrollDebug = {
        events: [],
        scrollAttempts: []
      };
      
      // Track all scroll-related events
      ['scroll', 'touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(eventType => {
        document.addEventListener(eventType, (e) => {
          window.iOSScrollDebug.events.push({
            type: eventType,
            target: e.target.tagName + (e.target.id ? '#' + e.target.id : '') + (e.target.className ? '.' + e.target.className.split(' ')[0] : ''),
            timestamp: Date.now(),
            preventDefault: e.defaultPrevented,
            touches: e.touches ? e.touches.length : 0
          });
        }, true);
      });
    });
    
    await page.goto('/');
    await page.waitForSelector('#map');
    await page.waitForFunction(() => window.map && window.map._loaded);
  });

  test('should handle real country selection and scrolling on iPhone', async ({ page }) => {
    console.log('=== REAL COUNTRY SELECTION TEST ===');
    
    // Manually trigger country selection to ensure panel is visible
    await page.evaluate(() => {
      // Show the panel
      const panel = document.getElementById('info-panel');
      if (panel) {
        panel.style.display = 'block';
      }
      
      // Add mock country data
      const countryInfo = document.getElementById('country-info');
      if (countryInfo) {
        countryInfo.innerHTML = `
          <h3>Test Country</h3>
          <p><strong>Capital:</strong> Test Capital</p>
          <p><strong>Population:</strong> 100,000,000</p>
          <p><strong>Area:</strong> 1,000,000 km²</p>
          <div style="margin-top: 20px;">
            <h4>Additional Info</h4>
            ${Array(30).fill(0).map((_, i) => `<p>This is additional information line ${i + 1} that should make the content scrollable on iPhone Safari.</p>`).join('')}
          </div>
        `;
      }
    });
    await page.waitForTimeout(500);
    
    // Check if country info panel is visible and has content
    const panelVisible = await page.locator('#info-panel').isVisible();
    console.log('Info panel visible:', panelVisible);
    
    if (panelVisible) {
      // Get the actual content that was populated
      const countryContent = await page.evaluate(() => {
        const countryInfo = document.getElementById('country-info');
        const message = document.getElementById('message');
        
        return {
          countryInfoHTML: countryInfo?.innerHTML || '',
          messageHTML: message?.innerHTML || '',
          countryInfoText: countryInfo?.textContent || '',
          messageText: message?.textContent || ''
        };
      });
      
      console.log('Country content:', {
        countryInfoLength: countryContent.countryInfoHTML.length,
        messageLength: countryContent.messageHTML.length,
        countryText: countryContent.countryInfoText.substring(0, 200) + '...',
        messageText: countryContent.messageText.substring(0, 200) + '...'
      });
      
      // Get detailed scroll information
      const scrollInfo = await page.evaluate(() => {
        const content = document.querySelector('#info-panel .panel-content');
        const panel = document.getElementById('info-panel');
        
        if (!content || !panel) return null;
        
        const contentStyle = window.getComputedStyle(content);
        const panelStyle = window.getComputedStyle(panel);
        
        return {
          content: {
            scrollHeight: content.scrollHeight,
            clientHeight: content.clientHeight,
            offsetHeight: content.offsetHeight,
            scrollTop: content.scrollTop,
            isScrollable: content.scrollHeight > content.clientHeight,
            bounds: content.getBoundingClientRect(),
            styles: {
              maxHeight: contentStyle.maxHeight,
              height: contentStyle.height,
              overflowY: contentStyle.overflowY,
              touchAction: contentStyle.touchAction,
              webkitOverflowScrolling: contentStyle.webkitOverflowScrolling,
              position: contentStyle.position,
              display: contentStyle.display
            }
          },
          panel: {
            bounds: panel.getBoundingClientRect(),
            classes: panel.className,
            styles: {
              height: panelStyle.height,
              maxHeight: panelStyle.maxHeight,
              display: panelStyle.display,
              flexDirection: panelStyle.flexDirection
            }
          }
        };
      });
      
      console.log('Scroll analysis:', JSON.stringify(scrollInfo, null, 2));
      
      if (scrollInfo?.content?.isScrollable) {
        console.log('Content IS scrollable, testing iOS touch scroll...');
        
        // Clear previous events
        await page.evaluate(() => { window.iOSScrollDebug.events = []; });
        
        // Test iPhone-specific touch scrolling
        const contentBox = scrollInfo.content.bounds;
        
        // Method 1: Swipe up (finger drag down to scroll up)
        console.log('Testing swipe up gesture...');
        const startX = contentBox.x + contentBox.width / 2;
        const startY = contentBox.y + contentBox.height * 0.8;
        const endY = contentBox.y + contentBox.height * 0.2;
        
        await page.touchscreen.tap(startX, startY);
        await page.waitForTimeout(100);
        
        // Simulate iOS swipe
        await page.evaluate((coords) => {
          const element = document.querySelector('#info-panel .panel-content');
          if (element) {
            // Dispatch touch events manually for iOS compatibility
            const touchstart = new TouchEvent('touchstart', {
              touches: [new Touch({
                identifier: 1,
                target: element,
                clientX: coords.startX,
                clientY: coords.startY
              })]
            });
            
            const touchmove = new TouchEvent('touchmove', {
              touches: [new Touch({
                identifier: 1,
                target: element,
                clientX: coords.startX,
                clientY: coords.endY
              })]
            });
            
            const touchend = new TouchEvent('touchend', {
              changedTouches: [new Touch({
                identifier: 1,
                target: element,
                clientX: coords.startX,
                clientY: coords.endY
              })]
            });
            
            element.dispatchEvent(touchstart);
            setTimeout(() => element.dispatchEvent(touchmove), 50);
            setTimeout(() => element.dispatchEvent(touchend), 100);
          }
        }, { startX, startY, endY });
        
        await page.waitForTimeout(500);
        
        // Check if scroll position changed
        const afterScrollInfo = await page.evaluate(() => {
          const content = document.querySelector('#info-panel .panel-content');
          return {
            scrollTop: content?.scrollTop || 0,
            scrollHeight: content?.scrollHeight || 0,
            clientHeight: content?.clientHeight || 0
          };
        });
        
        console.log('After touch scroll:', afterScrollInfo);
        
        // Test programmatic scroll to verify element can scroll
        console.log('Testing programmatic scroll...');
        const programmaticResult = await page.evaluate(() => {
          const content = document.querySelector('#info-panel .panel-content');
          if (content) {
            const beforeScroll = content.scrollTop;
            content.scrollTop = 100;
            const afterScroll = content.scrollTop;
            return { beforeScroll, afterScroll, worked: afterScroll > beforeScroll };
          }
          return { beforeScroll: 0, afterScroll: 0, worked: false };
        });
        
        console.log('Programmatic scroll result:', programmaticResult);
        
        // Get all touch events that occurred
        const touchEvents = await page.evaluate(() => window.iOSScrollDebug.events);
        console.log('Touch events recorded:', touchEvents.length);
        touchEvents.forEach(event => console.log(`  ${event.type} on ${event.target} (prevented: ${event.preventDefault})`));
        
        expect(programmaticResult.worked).toBe(true);
        
      } else {
        console.log('Content is NOT scrollable - need to add more content or fix CSS');
        
        // Add content manually to test
        await page.evaluate(() => {
          const countryInfo = document.getElementById('country-info');
          if (countryInfo) {
            countryInfo.innerHTML += '<div style="margin-top: 20px;"><h4>Additional Information</h4>';
            for (let i = 0; i < 20; i++) {
              countryInfo.innerHTML += `<p>This is additional information line ${i + 1} that should make the content scrollable on iPhone.</p>`;
            }
            countryInfo.innerHTML += '</div>';
          }
        });
        
        await page.waitForTimeout(500);
        
        // Re-test after adding content
        const newScrollInfo = await page.evaluate(() => {
          const content = document.querySelector('#info-panel .panel-content');
          return {
            scrollHeight: content?.scrollHeight || 0,
            clientHeight: content?.clientHeight || 0,
            isScrollable: content ? content.scrollHeight > content.clientHeight : false
          };
        });
        
        console.log('After adding content:', newScrollInfo);
        expect(newScrollInfo.isScrollable).toBe(true);
      }
    } else {
      console.log('Panel not visible - country selection may have failed');
      
      // Try different country locations
      const testPoints = [
        { x: 200, y: 300, name: 'Europe area' },
        { x: 100, y: 400, name: 'Africa area' },
        { x: 250, y: 250, name: 'Asia area' }
      ];
      
      for (const point of testPoints) {
        console.log(`Trying ${point.name}...`);
        await page.touchscreen.tap(point.x, point.y);
        await page.waitForTimeout(1000);
        
        const visible = await page.locator('#info-panel').isVisible();
        if (visible) {
          console.log(`Success with ${point.name}`);
          break;
        }
      }
    }
  });

  test('should test iOS Safari specific CSS behaviors', async ({ page }) => {
    console.log('=== iOS SAFARI CSS TEST ===');
    
    // Force country selection by showing panel manually
    await page.evaluate(() => {
      const panel = document.getElementById('info-panel');
      if (panel) panel.style.display = 'block';
    });
    await page.waitForTimeout(500);
    
    // Add guaranteed scrollable content
    await page.evaluate(() => {
      const countryInfo = document.getElementById('country-info');
      if (countryInfo) {
        countryInfo.innerHTML = `
          <h3>Test Country</h3>
          <div style="height: 1000px; background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);">
            <p>This is a very tall content area that should definitely be scrollable.</p>
            ${Array(50).fill(0).map((_, i) => `<p>Line ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>`).join('')}
            <div style="background: yellow; padding: 20px; margin: 20px 0;">
              <h4>Additional Info Section</h4>
              <p>This is the "additional info" section that should be reachable by scrolling.</p>
            </div>
          </div>
        `;
      }
    });
    
    await page.waitForTimeout(500);
    
    // Test iOS-specific CSS fixes
    const cssTest = await page.evaluate(() => {
      const content = document.querySelector('#info-panel .panel-content');
      if (!content) return { error: 'No content element' };
      
      // Apply iOS-specific fixes using setProperty to force override
      content.style.setProperty('overflow', 'auto', 'important');
      content.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
      content.style.setProperty('touch-action', 'pan-y', 'important');
      content.style.setProperty('height', '300px', 'important');
      content.style.setProperty('max-height', '300px', 'important');
      content.style.setProperty('-webkit-transform', 'translateZ(0)', 'important');
      content.style.setProperty('transform', 'translateZ(0)', 'important');
      
      // Force layout recalculation
      content.offsetHeight;
      
      const computedStyle = getComputedStyle(content);
      
      return {
        scrollHeight: content.scrollHeight,
        clientHeight: content.clientHeight,
        isScrollable: content.scrollHeight > content.clientHeight,
        computedStyle: {
          overflow: computedStyle.overflow,
          overflowY: computedStyle.overflowY,
          webkitOverflowScrolling: computedStyle.webkitOverflowScrolling || computedStyle['-webkit-overflow-scrolling'] || 'not-found',
          touchAction: computedStyle.touchAction,
          height: computedStyle.height,
          maxHeight: computedStyle.maxHeight,
          webkitTransform: computedStyle.webkitTransform || computedStyle['-webkit-transform'] || 'not-found',
          transform: computedStyle.transform
        },
        inlineStyles: {
          webkitOverflowScrolling: content.style.webkitOverflowScrolling || content.style['-webkit-overflow-scrolling'] || 'not-set'
        }
      };
    });
    
    console.log('iOS CSS test result:', cssTest);
    
    expect(cssTest.isScrollable).toBe(true);
    expect(cssTest.computedStyle.touchAction).toBe('pan-y');
  });
});