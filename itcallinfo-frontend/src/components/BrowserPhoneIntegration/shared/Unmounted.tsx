import React from 'react'

type Props = {
    handleRemount: () => void
}

const Unmounted = ({handleRemount}: Props) => {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-10 text-center h-full flex flex-col items-center justify-center column">
    <span className="material-icons text-6xl text-gray-400 mb-4">phone_disabled</span>
    <h3 className="text-xl font-medium text-gray-800 mb-2">Browser-Phone Component Unmounted</h3>
    <p className="text-gray-600 mb-6">The Browser-Phone component has been unmounted from the React application.</p>
    <button 
      className="bg-primary hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out flex items-center justify-center mx-auto"
      onClick={handleRemount}
    >
      <span className="material-icons text-sm mr-1">refresh</span>
      Remount Component
    </button>
  </div>
  )
}

export default Unmounted