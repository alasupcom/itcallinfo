/**
 * This script adds playful micro-interactions to the Browser-Phone UI
 * It's designed to be injected into the iframe containing the Browser-Phone
 */

(function() {
    // Wait for DOM to be fully loaded
    window.addEventListener('DOMContentLoaded', function() {
      // Initialize after a small delay to ensure all elements are loaded
      setTimeout(initMicroInteractions, 500);
    });
  
    // Main initialization function
    function initMicroInteractions() {
      console.log('Initializing Browser-Phone micro-interactions');
      
      // Add interaction effects to dialpad buttons
      setupDialpadEffects();
      
      // Add animations for call initiation and termination
      setupCallControlEffects();
      
      // Add tab switching animations
      setupTabEffects();
      
      // Add status indicator animations
      setupStatusIndicatorEffects();
      
      // Add ripple effects to all buttons
      setupRippleEffects();
  
      // Add smooth transitions when showing/hiding panels
      setupPanelTransitions();
  
      // Add audio feedback for interactions
      setupAudioFeedback();
    }
  
    // Apply effects to dialpad buttons
    function setupDialpadEffects() {
      // Find all dialpad buttons
      const dialpadButtons = document.querySelectorAll('.dialButtons button');
      
      if (dialpadButtons.length === 0) {
        console.log('No dialpad buttons found, retrying in 1s');
        setTimeout(setupDialpadEffects, 1000);
        return;
      }
      
      dialpadButtons.forEach(button => {
        // Add press effect
        button.addEventListener('mousedown', function() {
          this.style.transform = 'scale(0.95)';
          this.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2) inset';
          // Add highlight color briefly
          this.style.backgroundColor = '#e6f7ff';
          
          // Reset after a short delay
          setTimeout(() => {
            this.style.backgroundColor = '';
          }, 200);
        });
        
        // Reset on mouse up/leave
        ['mouseup', 'mouseleave'].forEach(evt => {
          button.addEventListener(evt, function() {
            this.style.transform = '';
            this.style.boxShadow = '';
          });
        });
      });
    }
  
    // Apply effects to call control buttons
    function setupCallControlEffects() {
      // Find call and hangup buttons
      const callButtons = document.querySelectorAll('.dialButton, .callButton');
      const hangupButtons = document.querySelectorAll('.hangupButton');
      
      // Apply effects to call buttons
      callButtons.forEach(button => {
        button.addEventListener('click', function() {
          // Add pulse animation class
          this.classList.add('pulse-animation');
          
          // Create ripple effect
          const ripple = document.createElement('span');
          ripple.classList.add('button-ripple');
          this.appendChild(ripple);
          
          // Remove ripple after animation completes
          setTimeout(() => {
            ripple.remove();
            this.classList.remove('pulse-animation');
          }, 1000);
        });
      });
      
      // Apply effects to hangup buttons
      hangupButtons.forEach(button => {
        button.addEventListener('click', function() {
          // Add shake animation
          this.classList.add('shake-animation');
          
          // Remove animation class after it completes
          setTimeout(() => {
            this.classList.remove('shake-animation');
          }, 820);
        });
      });
      
      // Add necessary CSS
      addStyles(`
        .pulse-animation {
          animation: pulse 0.5s ease-in-out;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .shake-animation {
          animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        
        .button-ripple {
          position: absolute;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          pointer-events: none;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          transform: scale(0);
          animation: ripple 0.6s linear;
        }
        
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `);
    }
  
    // Add tab switching effects
    function setupTabEffects() {
      // Find all tab elements
      const tabs = document.querySelectorAll('.tab');
      
      if (tabs.length === 0) {
        setTimeout(setupTabEffects, 1000);
        return;
      }
      
      tabs.forEach(tab => {
        tab.addEventListener('click', function() {
          // Add a brief highlight effect when switching tabs
          this.style.backgroundColor = '#e6f7ff';
          
          // Reset after animation
          setTimeout(() => {
            this.style.backgroundColor = '';
          }, 300);
        });
      });
      
      // Animate tab content when switching tabs
      addStyles(`
        .tab-content {
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .tab-content:not(.active) {
          opacity: 0;
          transform: translateY(10px);
          pointer-events: none;
        }
        
        .tab-content.active {
          opacity: 1;
          transform: translateY(0);
        }
      `);
    }
  
    // Add status indicator animations
    function setupStatusIndicatorEffects() {
      // Find status indicators (connection dots)
      const statusDots = document.querySelectorAll('.dotOnline, .dotOffline');
      
      if (statusDots.length === 0) {
        setTimeout(setupStatusIndicatorEffects, 1000);
        return;
      }
      
      // Add pulse animation to status dots
      addStyles(`
        .dotOnline, .dotOffline {
          transition: all 0.3s ease;
        }
        
        .dotOnline {
          animation: pulseDot 2s infinite;
        }
        
        @keyframes pulseDot {
          0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(46, 204, 113, 0); }
          100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
        }
        
        .dotOffline {
          animation: pulseOffline 2s infinite;
        }
        
        @keyframes pulseOffline {
          0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(231, 76, 60, 0); }
          100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
        }
      `);
    }
  
    // Add ripple effects to all buttons
    function setupRippleEffects() {
      // Apply to all buttons for a consistent experience
      const buttons = document.querySelectorAll('button');
      
      if (buttons.length === 0) {
        setTimeout(setupRippleEffects, 1000);
        return;
      }
      
      buttons.forEach(button => {
        // Add relative positioning if not already set
        if (getComputedStyle(button).position === 'static') {
          button.style.position = 'relative';
        }
        
        // Add overflow hidden to contain ripple
        button.style.overflow = 'hidden';
        
        // Add click handler for ripple effect
        button.addEventListener('click', function(e) {
          // Create ripple element
          const ripple = document.createElement('span');
          ripple.classList.add('ripple-effect');
          
          // Position ripple at click point
          const rect = this.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          const x = e.clientX - rect.left - size / 2;
          const y = e.clientY - rect.top - size / 2;
          
          ripple.style.width = ripple.style.height = `${size}px`;
          ripple.style.left = `${x}px`;
          ripple.style.top = `${y}px`;
          
          this.appendChild(ripple);
          
          // Remove after animation completes
          setTimeout(() => ripple.remove(), 600);
        });
      });
      
      // Add styles for ripple effect
      addStyles(`
        .ripple-effect {
          position: absolute;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.5);
          pointer-events: none;
          transform: scale(0);
          animation: ripple-anim 0.6s linear;
        }
        
        @keyframes ripple-anim {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `);
    }
  
    // Add smooth transitions for panels
    function setupPanelTransitions() {
      // Add general transition styles
      addStyles(`
        /* Smooth transitions for all UI elements */
        #buddyList div, 
        .contact, 
        .callHistoryRow, 
        .settingsOption,
        .presenceTable tr {
          transition: transform 0.2s ease, background-color 0.2s ease;
        }
        
        /* Hover effects */
        #buddyList div:hover, 
        .contact:hover, 
        .callHistoryRow:hover, 
        .settingsOption:hover,
        .presenceTable tr:hover {
          transform: translateY(-2px);
          background-color: #f0f7ff !important;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        /* Active effects */
        #buddyList div:active, 
        .contact:active, 
        .callHistoryRow:active, 
        .settingsOption:active,
        .presenceTable tr:active {
          transform: translateY(0);
        }
      `);
    }
  
    // Add audio feedback for interactions
    function setupAudioFeedback() {
      // Create audio elements
      const clickSound = createAudio('data:audio/mp3;base64,SUQzAwAAAAAAD1RDT04AAAAFSmluZ2xlAA==', 'click-sound');
      const dialSound = createAudio('data:audio/mp3;base64,SUQzAwAAAAAAD1RDT04AAAAFSmluZ2xlAA==', 'dial-sound');
      
      // Add click sound to dialpad buttons
      const dialpadButtons = document.querySelectorAll('.dialButtons button');
      dialpadButtons.forEach(button => {
        button.addEventListener('click', () => {
          // Play click sound
          clickSound.currentTime = 0;
          clickSound.play().catch(e => console.log('Audio play error:', e));
        });
      });
      
      // Add dial sound to call button
      const callButtons = document.querySelectorAll('.dialButton, .callButton');
      callButtons.forEach(button => {
        button.addEventListener('click', () => {
          // Play dial sound
          dialSound.currentTime = 0;
          dialSound.play().catch(e => console.log('Audio play error:', e));
        });
      });
    }
  
    // Helper function to create audio elements
    function createAudio(src, id) {
      const audio = document.createElement('audio');
      audio.id = id;
      audio.src = src;
      audio.preload = 'auto';
      document.body.appendChild(audio);
      return audio;
    }
  
    // Helper function to add styles to the document
    function addStyles(css) {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }
  })();