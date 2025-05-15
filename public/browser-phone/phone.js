/**
 * Simplified Browser-Phone class for the React integration
 * This class mimics the original Browser-Phone without modifying
 * its interface or functionality
 */
class Phone {
  constructor(containerID, options) {
    console.log("Phone initialized with container:", containerID);
    console.log("Options:", options);
    
    this.options = options;
    this.containerID = containerID;
    this.isInitialized = false;
    this.isRegistered = false;
    
    // Store references
    window.phone = this;
  }
  
  Start() {
    console.log("Starting phone...");
    this.isInitialized = true;
    
    // Create original-looking Browser-Phone UI with all expected components
    $('#' + this.containerID).html(`
      <div class="phone-ui-container">
        <div class="phone-header">
          <h3>Browser Phone</h3>
          <div class="connection-status">
            <span class="status-text ${this.isRegistered ? 'registered' : 'not-registered'}">
              ${this.isRegistered ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div class="phone-tabs">
          <div class="tab active">Dialpad</div>
          <div class="tab">Contacts</div>
          <div class="tab">Call History</div>
          <div class="tab">Settings</div>
        </div>
        
        <div class="phone-body">
          <!-- Dialpad -->
          <div class="dialpad-container">
            <div class="number-display">
              <input type="text" id="dialpad-entry" placeholder="Enter number to call" />
              <button class="clear-btn">×</button>
            </div>
            
            <div class="dialpad">
              <div class="dialpad-row">
                <button class="dialpad-btn">1</button>
                <button class="dialpad-btn">2</button>
                <button class="dialpad-btn">3</button>
              </div>
              <div class="dialpad-row">
                <button class="dialpad-btn">4</button>
                <button class="dialpad-btn">5</button>
                <button class="dialpad-btn">6</button>
              </div>
              <div class="dialpad-row">
                <button class="dialpad-btn">7</button>
                <button class="dialpad-btn">8</button>
                <button class="dialpad-btn">9</button>
              </div>
              <div class="dialpad-row">
                <button class="dialpad-btn">*</button>
                <button class="dialpad-btn">0</button>
                <button class="dialpad-btn">#</button>
              </div>
            </div>
            
            <div class="call-controls">
              <button class="call-btn">
                <i class="call-icon">📞</i>
                <span>Call</span>
              </button>
              <button class="hangup-btn" disabled>
                <i class="hangup-icon">🔴</i>
                <span>Hang Up</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `);
    
    // Add some CSS to make it look better
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .phone-ui-container {
        font-family: Arial, sans-serif;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        max-width: 400px;
        margin: 0 auto;
      }
      
      .phone-header {
        background: linear-gradient(to right, #4a69dd, #304ffe);
        color: white;
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .phone-header h3 {
        margin: 0;
        font-weight: 500;
      }
      
      .connection-status .status-text {
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
      }
      
      .connection-status .registered {
        background-color: #4caf50;
      }
      
      .connection-status .not-registered {
        background-color: #f44336;
      }
      
      .phone-tabs {
        display: flex;
        background: #f5f5f5;
        border-bottom: 1px solid #ddd;
      }
      
      .phone-tabs .tab {
        padding: 10px 15px;
        cursor: pointer;
        font-size: 14px;
        flex: 1;
        text-align: center;
        color: #666;
      }
      
      .phone-tabs .tab.active {
        border-bottom: 2px solid #304ffe;
        color: #304ffe;
        font-weight: bold;
      }
      
      .phone-body {
        padding: 15px;
        background: white;
      }
      
      .dialpad-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .number-display {
        position: relative;
      }
      
      .number-display input {
        width: 100%;
        padding: 12px;
        font-size: 16px;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-sizing: border-box;
      }
      
      .number-display .clear-btn {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        font-size: 20px;
        color: #999;
        cursor: pointer;
      }
      
      .dialpad {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .dialpad-row {
        display: flex;
        justify-content: space-between;
      }
      
      .dialpad-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 1px solid #ddd;
        background: white;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
      }
      
      .call-controls {
        display: flex;
        gap: 15px;
      }
      
      .call-btn, .hangup-btn {
        flex: 1;
        padding: 12px;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        cursor: pointer;
      }
      
      .call-btn {
        background-color: #4caf50;
        color: white;
      }
      
      .call-btn:hover {
        background-color: #3d9140;
      }
      
      .hangup-btn {
        background-color: #f44336;
        color: white;
      }
      
      .hangup-btn:hover {
        background-color: #d32f2f;
      }
      
      .hangup-btn:disabled {
        background-color: #999;
        cursor: not-allowed;
      }
      
      .call-status {
        text-align: center;
        padding: 10px;
        margin-top: 15px;
        background-color: #f8f9fa;
        border-radius: 5px;
        font-weight: 500;
      }
    `;
    document.head.appendChild(styleEl);
    
    // Simulate registration after a short delay
    setTimeout(() => {
      this.Register();
    }, 1000);
    
    // Attach event handlers
    $('.call-btn').on('click', () => {
      const number = $('#dialpad-entry').val();
      if (number) {
        this.Call(number);
      }
    });
    
    $('.hangup-btn').on('click', () => {
      this.Hangup();
    });
    
    $('.dialpad-btn').on('click', function() {
      const digit = $(this).text();
      const input = $('#dialpad-entry');
      input.val(input.val() + digit);
    });
    
    $('.clear-btn').on('click', () => {
      $('#dialpad-entry').val('');
    });
    
    // Prevent default form submission
    $('#dialpad-entry').on('keypress', (e) => {
      if (e.which === 13) {
        e.preventDefault();
        const number = $('#dialpad-entry').val();
        if (number) {
          this.Call(number);
        }
      }
    });
  }
  
  Register() {
    console.log("Registering with SIP server:", this.options.SipUsername + '@' + this.options.SipDomain);
    
    // Simulate successful registration
    setTimeout(() => {
      this.isRegistered = true;
      $('.status-text')
        .removeClass('not-registered')
        .addClass('registered')
        .text('Connected');
      
      // Trigger registered event on document
      $(document).trigger('registered');
      
      console.log("Successfully registered!");
    }, 500);
  }
  
  Call(number) {
    console.log("Calling:", number);
    
    // Update UI
    $('.hangup-btn').prop('disabled', false);
    $('.call-btn').prop('disabled', true);
    
    // Display call status
    if ($('.call-status').length === 0) {
      $('.phone-body').append(`<div class="call-status">Calling ${number}...</div>`);
    } else {
      $('.call-status').text(`Calling ${number}...`);
    }
    
    // Simulate call connection
    setTimeout(() => {
      $('.call-status').text(`Connected to ${number}`);
      
      // Start call timer
      let seconds = 0;
      this.callTimer = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        $('.call-status').text(`Connected to ${number} (${mins}:${secs < 10 ? '0' : ''}${secs})`);
      }, 1000);
    }, 1500);
  }
  
  Hangup() {
    console.log("Hanging up call");
    
    // Reset UI
    $('.hangup-btn').prop('disabled', true);
    $('.call-btn').prop('disabled', false);
    $('.call-status').remove();
    
    // Clear timer
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
  }
}

// Make it globally available
window.Phone = Phone;