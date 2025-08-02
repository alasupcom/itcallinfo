import { ConnectionStatus } from './BrowserPhoneIntegration';

interface IntegrationControlsProps {
  connectionStatus: ConnectionStatus;
  events: string[];
  onRefresh: () => void;
  onUnmount: () => void;
  onRemount: () => void;
  isMounted: boolean;
}

export default function IntegrationControls({
  connectionStatus,
  events,
  onRefresh,
  onUnmount,
  onRemount,
  isMounted
}: IntegrationControlsProps) {
  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-medium mb-3 text-gray-800">Integration Controls</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Container Status</label>
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full ${isMounted ? 'bg-green-500' : 'bg-gray-500'} mr-2`}></span>
              <span className="text-sm text-gray-700">{isMounted ? 'Active' : 'Unmounted'}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SIP Connection</label>
            <div className="flex items-center">
              <span 
                className={`inline-block w-3 h-3 rounded-full ${connectionStatus.sipStatus ? 'bg-green-500' : 'bg-red-500'} mr-2`}
              ></span>
              <span className="text-sm text-gray-700">{connectionStatus.sipStatusText}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">React Events</label>
            <div className="text-xs text-gray-500 border border-gray-200 rounded p-2 bg-gray-50 h-24 overflow-y-auto">
              {events.map((event, index) => (
                <div key={index} className="mb-1">{event}</div>
              ))}
            </div>
          </div>

          {isMounted ? (
            <>
              <div className="pt-2">
                <button 
                  className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out flex items-center justify-center"
                  onClick={onRefresh}
                >
                  <span className="material-icons text-sm mr-1">refresh</span>
                  Refresh Connection
                </button>
              </div>

              <div>
                <button 
                  className="w-full bg-error hover:bg-red-500 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out flex items-center justify-center"
                  onClick={onUnmount}
                >
                  <span className="material-icons text-sm mr-1">power_settings_new</span>
                  Unmount Component
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2">
              <button 
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out flex items-center justify-center"
                onClick={onRemount}
              >
                <span className="material-icons text-sm mr-1">power_settings_new</span>
                Remount Component
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-medium mb-3 text-gray-800">React Integration Info</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>This container demonstrates how to integrate a jQuery-based application (Browser-Phone) into a React environment while preserving all original functionality.</p>
          <p>Key implementation notes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Uses React useEffect and useRef for proper jQuery initialization</li>
            <li>Scripts loaded dynamically in correct sequence</li>
            <li>CSS isolation to prevent style conflicts</li>
            <li>Event proxying between React and jQuery</li>
          </ul>
        </div>
      </div>
    </>
  );
}
